/**
 * @file app/api/users/[userId]/route.ts
 * @description 사용자 정보 조회 API
 *
 * GET: 사용자 정보 및 통계 조회
 * - URL 파라미터 userId는 Clerk user ID로 받음
 * - clerk_id로 users 테이블 조회
 * - user_stats 뷰 활용하여 통계 정보 포함
 * - 현재 로그인 사용자의 팔로우 상태 확인
 *
 * @see docs/PRD.md
 * @see docs/TODO.md
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/utils/supabase/server";
import type { UserWithStats } from "@/lib/types";

/**
 * GET /api/users/[userId]
 * 사용자 정보 및 통계 조회
 *
 * @param request - NextRequest 객체
 * @param params - 경로 파라미터 (userId: Clerk user ID)
 * @returns 사용자 정보 및 통계, 팔로우 상태
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: clerkUserId } = await params;
    const supabase = await createClient();

    // 1. Clerk user ID로 Supabase user 조회
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 2. user_stats 뷰에서 통계 정보 조회
    const { data: userStats, error: statsError } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (statsError) {
      console.error("User stats query error:", statsError);
      // 통계가 없어도 기본값으로 반환
    }

    // 3. 현재 로그인 사용자의 팔로우 상태 확인
    const { userId: currentClerkUserId } = await auth();
    let isFollowing = false;

    if (currentClerkUserId && currentClerkUserId !== clerkUserId) {
      // 현재 사용자의 Supabase user ID 조회
      const { data: currentUser } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", currentClerkUserId)
        .single();

      if (currentUser) {
        // follows 테이블에서 팔로우 관계 확인
        const { data: follow } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", currentUser.id)
          .eq("following_id", user.id)
          .single();

        isFollowing = !!follow;
      }
    }

    // 4. UserWithStats 형식으로 변환
    const userWithStats: UserWithStats & { isFollowing: boolean } = {
      id: user.id,
      clerk_id: user.clerk_id,
      name: user.name,
      created_at: user.created_at,
      posts_count: Number(userStats?.posts_count) || 0,
      followers_count: Number(userStats?.followers_count) || 0,
      following_count: Number(userStats?.following_count) || 0,
      isFollowing,
    };

    return NextResponse.json(userWithStats);
  } catch (error) {
    console.error("GET /api/users/[userId] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "사용자 정보 조회에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

