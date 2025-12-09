/**
 * @file app/api/search/route.ts
 * @description 검색 API
 *
 * GET: 일반 검색 기능
 * - 게시물의 caption, title에서 검색
 * - 사용자 이름에서 검색
 * - 페이지네이션 지원
 */

import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/utils/supabase/clerk-server";
import type { PostWithStats, User } from "@/lib/types";

// Route Segment Config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/search
 * 검색 기능
 *
 * @param request - NextRequest 객체
 * @returns 검색 결과 (게시물 및 사용자)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClerkSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    // 쿼리 파라미터 파싱
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "all"; // "all", "posts", "users"
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // 검색어가 없으면 빈 결과 반환
    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        posts: [],
        users: [],
        hasMore: false,
      });
    }

    const searchQuery = query.trim();

    const results: {
      posts: PostWithStats[];
      users: User[];
      postUsers: User[]; // 게시물 작성자 정보
      hasMore: boolean;
    } = {
      posts: [],
      users: [],
      postUsers: [],
      hasMore: false,
    };

    // 게시물 검색 (caption, title에서 검색)
    if (type === "all" || type === "posts") {
      // post_stats 뷰에서 검색
      // PostgreSQL의 ILIKE를 사용하여 대소문자 구분 없이 검색
      // Supabase PostgREST에서는 or()와 ilike()를 함께 사용할 때 올바른 형식 필요
      let query = supabase
        .from("post_stats")
        .select("*");

      // caption 또는 title에서 검색
      // or() 메서드 사용 시 올바른 형식: "field1.ilike.value,field2.ilike.value"
      query = query.or(
        `caption.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`
      );

      const { data: postStats, error: postsError } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (postsError) {
        console.error("Posts search error:", postsError);
      } else if (postStats && postStats.length > 0) {
        // 사용자 정보 조회
        const userIds = [...new Set(postStats.map((p) => p.user_id))];
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("id, clerk_id, name, created_at")
          .in("id", userIds);

        if (usersError) {
          console.error("Users query error:", usersError);
        }

        // PostWithStats 형식으로 변환
        results.posts = postStats.map((stat) => ({
          id: stat.post_id,
          user_id: stat.user_id,
          image_url: stat.image_url,
          title: stat.title || null,
          caption: stat.caption,
          created_at: stat.created_at,
          updated_at: stat.created_at,
          likes_count: Number(stat.likes_count) || 0,
          comments_count: Number(stat.comments_count) || 0,
        }));

        // 게시물 작성자 정보 저장
        results.postUsers = users || [];

        results.hasMore = postStats.length === limit;
      }
    }

    // 사용자 검색 (이름에서 검색)
    if (type === "all" || type === "users") {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, clerk_id, name, created_at")
        .ilike("name", `%${searchQuery}%`)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (usersError) {
        console.error("Users search error:", usersError);
      } else if (users) {
        results.users = users;
        // 사용자 검색 결과가 limit만큼 있으면 더 있을 수 있음
        if (users.length === limit) {
          results.hasMore = true;
        }
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
