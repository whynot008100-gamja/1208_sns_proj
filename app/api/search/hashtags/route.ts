/**
 * @file app/api/search/hashtags/route.ts
 * @description 해시태그 검색 API
 *
 * GET: 해시태그 이름으로 검색
 * - 쿼리 파라미터: q (검색어), limit, offset
 * - 반환: 해시태그 목록 (이름 부분 일치, 사용 빈도순 정렬)
 * - 해시태그 통계 정보 포함 (게시물 수)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/utils/supabase/clerk-server";
import type { HashtagStats } from "@/lib/types";

/**
 * GET /api/search/hashtags
 * 해시태그 이름으로 검색
 *
 * @param request - NextRequest 객체
 * @returns 해시태그 목록 및 페이지네이션 정보
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
        hashtags: [],
        hasMore: false,
      });
    }

    // 검색어 정규화 (앞뒤 공백 제거, 소문자 변환)
    const normalizedQuery = query.trim().toLowerCase();

    // hashtag_stats 뷰에서 검색 (이름으로 검색, 게시물 수 많은 순으로 정렬)
    let dbQuery = supabase
      .from("hashtag_stats")
      .select("*")
      .ilike("hashtag_name", `%${normalizedQuery}%`)
      .order("posts_count", { ascending: false })
      .order("hashtag_name", { ascending: true })
      .range(offset, offset + limit - 1);

    const { data: hashtagStats, error: hashtagsError } = await dbQuery;

    if (hashtagsError) {
      console.error("Hashtags search error:", hashtagsError);
      return NextResponse.json(
        { error: "해시태그 검색에 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }

    if (!hashtagStats || hashtagStats.length === 0) {
      return NextResponse.json({
        hashtags: [],
        hasMore: false,
      });
    }

    // HashtagStats 형식으로 변환
    const hashtags: HashtagStats[] = hashtagStats.map((stat) => ({
      hashtag_id: stat.hashtag_id,
      hashtag_name: stat.hashtag_name,
      created_at: stat.created_at,
      posts_count: Number(stat.posts_count) || 0,
    }));

    // 다음 페이지가 있는지 확인
    const hasMore = hashtags.length === limit;

    return NextResponse.json({
      hashtags,
      hasMore,
    });
  } catch (error) {
    console.error("GET /api/search/hashtags error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "해시태그 검색에 실패했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}

