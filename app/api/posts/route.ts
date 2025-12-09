/**
 * @file app/api/posts/route.ts
 * @description 게시물 조회 및 생성 API
 *
 * GET: 게시물 목록 조회
 * - 시간 역순 정렬
 * - 페이지네이션 지원 (limit, offset)
 * - userId 파라미터 지원 (프로필 페이지용)
 * - post_stats 뷰 활용하여 좋아요 수, 댓글 수 포함
 *
 * POST: 게시물 생성
 * - Clerk 인증 검증
 * - 이미지 파일 검증 (최대 5MB, JPEG/PNG/WebP만)
 * - Supabase Storage 업로드 (posts 버킷)
 * - posts 테이블에 데이터 저장
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/utils/supabase/clerk-server";
import type { PostWithStats } from "@/lib/types";

// Route Segment Config: Next.js 15 API Routes 설정
export const runtime = 'nodejs';
export const maxDuration = 300; // 5분 (큰 파일 업로드용)

// Next.js 15에서 큰 FormData를 처리하기 위한 설정
// 참고: body size limit은 기본적으로 충분하지만, 명시적으로 설정
export const dynamic = 'force-dynamic';

/**
 * GET /api/posts
 * 게시물 목록 조회
 *
 * @param request - NextRequest 객체
 * @returns 게시물 목록 및 페이지네이션 정보
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClerkSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    // 쿼리 파라미터 파싱
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const userId = searchParams.get("userId");

    // post_stats 뷰에서 데이터 조회
    let query = supabase
      .from("post_stats")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // userId가 제공된 경우 필터링
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: postStats, error: statsError } = await query;

    if (statsError) {
      console.error("Post stats query error:", statsError);
      return NextResponse.json(
        { error: "게시물을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }

    if (!postStats || postStats.length === 0) {
      return NextResponse.json({
        posts: [],
        hasMore: false,
      });
    }

    // 사용자 정보 조회를 위한 user_id 목록 추출
    const userIds = [...new Set(postStats.map((p) => p.user_id))];

    // users 테이블에서 사용자 정보 조회
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, clerk_id, name")
      .in("id", userIds);

    if (usersError) {
      console.error("Users query error:", usersError);
      // 사용자 정보가 없어도 게시물은 반환
    }

    // 사용자 정보를 맵으로 변환
    const userMap = new Map(
      (users || []).map((user) => [user.id, user])
    );

    // PostWithStats 형식으로 변환
    const posts: PostWithStats[] = postStats.map((stat) => ({
      id: stat.post_id,
      user_id: stat.user_id,
      image_url: stat.image_url,
      title: stat.title || null,
      caption: stat.caption,
      created_at: stat.created_at,
      updated_at: stat.created_at, // post_stats에는 updated_at이 없으므로 created_at 사용
      likes_count: Number(stat.likes_count) || 0,
      comments_count: Number(stat.comments_count) || 0,
    }));

    // 다음 페이지가 있는지 확인
    const hasMore = postStats.length === limit;

    return NextResponse.json({
      posts,
      hasMore,
      users: Array.from(userMap.values()), // 사용자 정보도 함께 반환
    });
  } catch (error) {
    console.error("Posts API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/posts
 * 게시물 생성 (메타데이터만 저장)
 *
 * 클라이언트에서 직접 Supabase Storage에 파일을 업로드한 후,
 * 이 API를 호출하여 posts 테이블에 메타데이터만 저장합니다.
 *
 * @param request - NextRequest 객체 (JSON body: { image_url, title, caption })
 * @returns 생성된 게시물 데이터
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 인증 검증
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 2. JSON body 파싱
    let body: { image_url: string; title?: string | null; caption?: string | null };
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error("❌ JSON parsing error:", jsonError);
      return NextResponse.json(
        { error: "잘못된 요청 형식입니다. JSON 형식이 필요합니다." },
        { status: 400 }
      );
    }

    // 3. 필수 필드 검증
    if (!body.image_url || typeof body.image_url !== "string") {
      return NextResponse.json(
        { error: "image_url이 필요합니다." },
        { status: 400 }
      );
    }

    // image_url이 Supabase Storage URL인지 검증
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    if (!body.image_url.startsWith(`${supabaseUrl}/storage/v1/object/public/posts/`)) {
      return NextResponse.json(
        { error: "유효하지 않은 이미지 URL입니다." },
        { status: 400 }
      );
    }

    // 4. Clerk User ID로 Supabase User ID 조회
    const supabase = createClerkSupabaseClient();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !user) {
      console.error("User lookup error:", userError);
      return NextResponse.json(
        {
          error: "사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.",
        },
        { status: 404 }
      );
    }

    // 5. posts 테이블에 데이터 저장
    const { data: post, error: insertError } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        image_url: body.image_url,
        title: body.title && body.title.trim() ? body.title.trim() : null,
        caption: body.caption && body.caption.trim() ? body.caption.trim() : null,
      })
      .select()
      .single();

    if (insertError || !post) {
      console.error("Post insert error:", {
        error: insertError,
        userId: user.id,
        imageUrl: body.image_url,
        title: body.title,
        caption: body.caption ? body.caption.substring(0, 50) + "..." : null,
      });
      
      return NextResponse.json(
        { 
          error: "게시물 저장에 실패했습니다. 잠시 후 다시 시도해주세요.",
          details: insertError?.message 
        },
        { status: 500 }
      );
    }

    // 6. 응답 반환 (PostWithStats 형식으로 변환)
    const postWithStats: PostWithStats = {
      ...post,
      likes_count: 0,
      comments_count: 0,
    };

    return NextResponse.json(postWithStats, { status: 201 });
  } catch (error) {
    console.error("POST /api/posts error:", {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    let errorMessage = "게시물 생성에 실패했습니다. 잠시 후 다시 시도해주세요.";
    if (error instanceof Error) {
      errorMessage = error.message || errorMessage;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

