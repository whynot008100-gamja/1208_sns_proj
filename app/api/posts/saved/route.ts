/**
 * @file app/api/posts/saved/route.ts
 * @description 저장된 게시물 목록 조회 API
 *
 * GET: 현재 로그인한 사용자가 저장한 게시물 목록 조회
 * - saves 테이블과 posts 테이블 JOIN
 * - post_stats 뷰 활용하여 좋아요/댓글 수 포함
 * - 페이지네이션 지원
 *
 * @see docs/PRD.md
 * @see supabase/migrations/20250102000002_create_saves_table.sql
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/utils/supabase/server";
import type { PostWithStats, User } from "@/lib/types";

/**
 * GET /api/posts/saved
 * 저장된 게시물 목록 조회
 *
 * @param request - NextRequest 객체
 * @returns 저장된 게시물 목록 및 페이지네이션 정보
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 인증 검증
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 2. 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // 3. Clerk User ID로 Supabase User ID 조회
    const supabase = await createClient();
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

    // 4. saves 테이블에서 저장된 게시물 ID 목록 조회 (저장 시간순 정렬)
    const { data: saves, error: savesError } = await supabase
      .from("saves")
      .select("post_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (savesError) {
      console.error("Saves query error:", savesError);
      return NextResponse.json(
        { error: "저장된 게시물을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    if (!saves || saves.length === 0) {
      return NextResponse.json({
        posts: [],
        hasMore: false,
        users: [],
      });
    }

    // 5. 저장된 게시물 ID 목록 추출
    const postIds = saves.map((save) => save.post_id);

    // 6. post_stats 뷰에서 게시물 정보 조회
    const { data: postStats, error: statsError } = await supabase
      .from("post_stats")
      .select("*")
      .in("post_id", postIds);

    if (statsError) {
      console.error("Post stats query error:", statsError);
      return NextResponse.json(
        { error: "게시물 정보를 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    if (!postStats || postStats.length === 0) {
      return NextResponse.json({
        posts: [],
        hasMore: false,
        users: [],
      });
    }

    // 7. 저장 시간순으로 정렬 (saves의 순서 유지)
    const postStatsMap = new Map(
      postStats.map((stat) => [stat.post_id, stat])
    );
    const sortedPostStats = postIds
      .map((postId) => postStatsMap.get(postId))
      .filter((stat): stat is typeof postStats[0] => stat !== undefined);

    // 8. 사용자 정보 조회를 위한 user_id 목록 추출
    const userIds = [...new Set(sortedPostStats.map((p) => p.user_id))];

    // 9. users 테이블에서 사용자 정보 조회
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, clerk_id, name")
      .in("id", userIds);

    if (usersError) {
      console.error("Users query error:", usersError);
      // 사용자 정보가 없어도 게시물은 반환
    }

    // 10. PostWithStats 형식으로 변환
    const posts: PostWithStats[] = sortedPostStats.map((stat) => ({
      id: stat.post_id,
      user_id: stat.user_id,
      image_url: stat.image_url,
      caption: stat.caption,
      created_at: stat.created_at,
      updated_at: stat.created_at, // post_stats에는 updated_at이 없으므로 created_at 사용
      likes_count: Number(stat.likes_count) || 0,
      comments_count: Number(stat.comments_count) || 0,
    }));

    // 11. 다음 페이지가 있는지 확인
    const hasMore = saves.length === limit;

    return NextResponse.json({
      posts,
      hasMore,
      users: (users || []).map((user) => ({
        id: user.id,
        clerk_id: user.clerk_id,
        name: user.name,
        created_at: "", // 사용자 정보에는 created_at이 없으므로 빈 문자열
      })),
    });
  } catch (error) {
    console.error("GET /api/posts/saved error:", error);
    return NextResponse.json(
      {
        error: "저장된 게시물을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}

