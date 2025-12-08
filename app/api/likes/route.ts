/**
 * @file app/api/likes/route.ts
 * @description 좋아요 API
 *
 * POST: 좋아요 추가
 * DELETE: 좋아요 제거
 *
 * @see docs/PRD.md
 * @see supabase/migrations/DB.sql
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/likes
 * 좋아요 추가
 *
 * @param request - NextRequest 객체 (JSON body: { postId: string })
 * @returns 좋아요 정보
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

    // 2. 요청 본문 파싱
    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { error: "postId가 필요합니다." },
        { status: 400 }
      );
    }

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

    // 4. 좋아요 추가 (UNIQUE 제약조건으로 중복 방지)
    const { data: like, error: insertError } = await supabase
      .from("likes")
      .insert({
        post_id: postId,
        user_id: user.id,
      })
      .select()
      .single();

    // 중복 좋아요인 경우 (이미 좋아요를 누른 경우)
    if (insertError) {
      // UNIQUE 제약조건 위반 (23505 = unique_violation)
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "이미 좋아요를 누른 게시물입니다." },
          { status: 409 }
        );
      }

      console.error("Like insert error:", insertError);
      return NextResponse.json(
        { error: "좋아요 추가에 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }

    return NextResponse.json(like, { status: 201 });
  } catch (error) {
    console.error("POST /api/likes error:", error);
    return NextResponse.json(
      {
        error: "좋아요 추가에 실패했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/likes
 * 좋아요 제거
 *
 * @param request - NextRequest 객체 (query params: postId)
 * @returns 성공 메시지
 */
export async function DELETE(request: NextRequest) {
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
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json(
        { error: "postId 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

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

    // 4. 좋아요 제거
    const { error: deleteError } = await supabase
      .from("likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Like delete error:", deleteError);
      return NextResponse.json(
        { error: "좋아요 제거에 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/likes error:", error);
    return NextResponse.json(
      {
        error: "좋아요 제거에 실패했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}

