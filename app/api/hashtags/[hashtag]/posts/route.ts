/**
 * @file app/api/hashtags/[hashtag]/posts/route.ts
 * @description 특정 해시태그가 포함된 게시물 목록 조회 API
 *
 * GET: 특정 해시태그가 포함된 게시물 목록
 * - URL 파라미터: hashtag (해시태그 이름)
 * - 쿼리 파라미터: limit, offset
 * - 반환: 게시물 목록 (시간 역순 정렬)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/utils/supabase/clerk-server";
import type { PostWithStats } from "@/lib/types";

/**
 * GET /api/hashtags/[hashtag]/posts
 * 특정 해시태그가 포함된 게시물 목록 조회
 *
 * @param request - NextRequest 객체
 * @param params - 경로 파라미터 (hashtag: 해시태그 이름)
 * @returns 게시물 목록 및 페이지네이션 정보
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hashtag: string }> }
) {
  try {
    const { hashtag: hashtagName } = await params;
    const supabase = createClerkSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    // 쿼리 파라미터 파싱
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // 해시태그 이름 디코딩 (URL 인코딩된 경우)
    const decodedHashtagName = decodeURIComponent(hashtagName);

    // 1. 해시태그 ID 조회
    const { data: hashtag, error: hashtagError } = await supabase
      .from("hashtags")
      .select("id")
      .eq("name", decodedHashtagName)
      .single();

    if (hashtagError || !hashtag) {
      return NextResponse.json(
        { error: "해시태그를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 2. 해당 해시태그가 연결된 게시물 ID 목록 조회
    const { data: postHashtags, error: postHashtagsError } = await supabase
      .from("post_hashtags")
      .select("post_id")
      .eq("hashtag_id", hashtag.id);

    if (postHashtagsError) {
      console.error("Post hashtags query error:", postHashtagsError);
      return NextResponse.json(
        { error: "게시물을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }

    if (!postHashtags || postHashtags.length === 0) {
      return NextResponse.json({
        posts: [],
        hasMore: false,
      });
    }

    // 게시물 ID 목록 추출
    const postIds = postHashtags.map((ph) => ph.post_id);

    // 3. post_stats 뷰에서 게시물 데이터 조회
    const { data: postStats, error: statsError } = await supabase
      .from("post_stats")
      .select("*")
      .in("post_id", postIds)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

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
    console.error("GET /api/hashtags/[hashtag]/posts error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "게시물을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}

