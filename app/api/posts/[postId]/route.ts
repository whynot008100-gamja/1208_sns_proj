/**
 * @file app/api/posts/[postId]/route.ts
 * @description 단일 게시물 조회 API
 *
 * GET: 단일 게시물 상세 정보 조회
 * - post_stats 뷰 활용하여 좋아요 수, 댓글 수 포함
 * - users 테이블과 JOIN하여 사용자 정보 포함
 *
 * @see docs/PRD.md
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { PostWithStats, User } from "@/lib/types";

/**
 * GET /api/posts/[postId]
 * 단일 게시물 조회
 *
 * @param request - NextRequest 객체
 * @param params - 경로 파라미터 (postId)
 * @returns 게시물 상세 정보
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const supabase = await createClient();

    // post_stats 뷰에서 게시물 조회
    const { data: postStat, error: statsError } = await supabase
      .from("post_stats")
      .select("*")
      .eq("post_id", postId)
      .single();

    if (statsError || !postStat) {
      return NextResponse.json(
        { error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .eq("id", postStat.user_id)
      .single();

    if (userError) {
      console.error("User query error:", userError);
      // 사용자 정보가 없어도 게시물은 반환
    }

    // PostWithStats 형식으로 변환
    const post: PostWithStats = {
      id: postStat.post_id,
      user_id: postStat.user_id,
      image_url: postStat.image_url,
      caption: postStat.caption,
      created_at: postStat.created_at,
      updated_at: postStat.created_at, // post_stats에는 updated_at이 없으므로 created_at 사용
      likes_count: Number(postStat.likes_count) || 0,
      comments_count: Number(postStat.comments_count) || 0,
    };

    return NextResponse.json({
      post,
      user: user || undefined,
    });
  } catch (error) {
    console.error("Post detail API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

