/**
 * @file app/api/follows/route.ts
 * @description 팔로우 API
 *
 * POST: 팔로우 추가
 * DELETE: 팔로우 제거
 *
 * @see docs/PRD.md
 * @see docs/TODO.md
 * @see supabase/migrations/DB.sql
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/follows
 * 팔로우 추가
 *
 * @param request - NextRequest 객체 (body: { followingId: string })
 * @returns 성공 메시지
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 인증 검증
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 2. 요청 본문 파싱
    const body = await request.json();
    const { followingId } = body;

    if (!followingId || typeof followingId !== "string") {
      return NextResponse.json(
        { error: "followingId가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 3. 현재 사용자의 Supabase user ID 조회
    const { data: currentUser, error: currentUserError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (currentUserError || !currentUser) {
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 4. 자기 자신 팔로우 방지
    if (currentUser.id === followingId) {
      return NextResponse.json(
        { error: "자기 자신을 팔로우할 수 없습니다." },
        { status: 400 }
      );
    }

    // 5. 팔로우 대상 사용자 존재 확인
    const { data: followingUser, error: followingUserError } = await supabase
      .from("users")
      .select("id")
      .eq("id", followingId)
      .single();

    if (followingUserError || !followingUser) {
      return NextResponse.json(
        { error: "팔로우할 사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 6. follows 테이블에 INSERT
    const { data: follow, error: insertError } = await supabase
      .from("follows")
      .insert({
        follower_id: currentUser.id,
        following_id: followingId,
      })
      .select()
      .single();

    if (insertError) {
      // 중복 팔로우 시도 (UNIQUE 제약조건 위반)
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "이미 팔로우 중입니다." },
          { status: 409 }
        );
      }

      console.error("Follow insert error:", insertError);
      return NextResponse.json(
        { error: "팔로우에 실패했습니다.", details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, follow },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/follows error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "팔로우에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/follows
 * 팔로우 제거
 *
 * @param request - NextRequest 객체 (query: { followingId: string })
 * @returns 성공 메시지
 */
export async function DELETE(request: NextRequest) {
  try {
    // 1. 인증 검증
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 2. 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const followingId = searchParams.get("followingId");

    if (!followingId) {
      return NextResponse.json(
        { error: "followingId가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 3. 현재 사용자의 Supabase user ID 조회
    const { data: currentUser, error: currentUserError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (currentUserError || !currentUser) {
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 4. follows 테이블에서 DELETE
    const { error: deleteError } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", currentUser.id)
      .eq("following_id", followingId);

    if (deleteError) {
      console.error("Follow delete error:", deleteError);
      return NextResponse.json(
        { error: "팔로우 취소에 실패했습니다.", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/follows error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "팔로우 취소에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

