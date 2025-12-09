/**
 * @file app/api/search/users/route.ts
 * @description 사용자 검색 API
 *
 * GET: 사용자 이름으로 검색
 * - 쿼리 파라미터: q (검색어), limit, offset
 * - 반환: 사용자 목록 (이름 부분 일치, 대소문자 무시)
 * - 사용자 통계 정보 포함
 */

import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/utils/supabase/clerk-server";
import type { UserWithStats } from "@/lib/types";

/**
 * GET /api/search/users
 * 사용자 이름으로 검색
 *
 * @param request - NextRequest 객체
 * @returns 사용자 목록 및 페이지네이션 정보
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClerkSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    // 쿼리 파라미터 파싱
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // 검색어가 없으면 빈 결과 반환
    if (!query.trim()) {
      return NextResponse.json({
        users: [],
        hasMore: false,
      });
    }

    // 검색어 정규화 (앞뒤 공백 제거, 소문자 변환)
    const normalizedQuery = query.trim().toLowerCase();

    // users 테이블에서 이름으로 검색 (ILIKE 사용, 대소문자 무시)
    let dbQuery = supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .ilike("name", `%${normalizedQuery}%`)
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1);

    const { data: users, error: usersError } = await dbQuery;

    if (usersError) {
      console.error("Users search error:", usersError);
      return NextResponse.json(
        { error: "사용자 검색에 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        users: [],
        hasMore: false,
      });
    }

    // 사용자 ID 목록 추출
    const userIds = users.map((u) => u.id);

    // user_stats 뷰에서 통계 정보 조회
    const { data: userStats, error: statsError } = await supabase
      .from("user_stats")
      .select("*")
      .in("user_id", userIds);

    if (statsError) {
      console.error("User stats query error:", statsError);
      // 통계가 없어도 사용자 정보는 반환
    }

    // 통계 정보를 맵으로 변환
    const statsMap = new Map(
      (userStats || []).map((stat) => [stat.user_id, stat])
    );

    // UserWithStats 형식으로 변환
    const usersWithStats: UserWithStats[] = users.map((user) => {
      const stats = statsMap.get(user.id);
      return {
        id: user.id,
        clerk_id: user.clerk_id,
        name: user.name,
        created_at: user.created_at,
        posts_count: Number(stats?.posts_count) || 0,
        followers_count: Number(stats?.followers_count) || 0,
        following_count: Number(stats?.following_count) || 0,
      };
    });

    // 다음 페이지가 있는지 확인
    const hasMore = users.length === limit;

    return NextResponse.json({
      users: usersWithStats,
      hasMore,
    });
  } catch (error) {
    console.error("GET /api/search/users error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "사용자 검색에 실패했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}

