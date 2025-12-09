/**
 * @file app/api/saves/route.ts
 * @description 게시물 저장/북마크 API
 *
 * POST: 게시물 저장
 * DELETE: 저장 취소
 * GET: 저장 상태 확인
 *
 * @see docs/PRD.md
 * @see supabase/migrations/20250102000002_create_saves_table.sql
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/saves
 * 게시물 저장
 *
 * @param request - NextRequest 객체 (JSON body: { postId: string })
 * @returns 저장 정보
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

    // 4. 게시물 존재 확인
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      console.error("Post lookup error:", postError);
      return NextResponse.json(
        { error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 5. 저장 추가 (UNIQUE 제약조건으로 중복 방지)
    const { data: save, error: insertError } = await supabase
      .from("saves")
      .insert({
        post_id: postId,
        user_id: user.id,
      })
      .select()
      .single();

    // 중복 저장인 경우 (이미 저장한 경우)
    if (insertError) {
      // UNIQUE 제약조건 위반 (23505 = unique_violation)
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "이미 저장한 게시물입니다." },
          { status: 409 }
        );
      }

      console.error("Save insert error:", {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      });
      
      // 테이블이 존재하지 않는 경우 (42P01 = undefined_table)
      if (insertError.code === "42P01") {
        return NextResponse.json(
          { 
            error: "저장 기능이 아직 준비되지 않았습니다. 데이터베이스 마이그레이션을 적용해주세요.",
            code: "TABLE_NOT_FOUND"
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: "저장에 실패했습니다. 잠시 후 다시 시도해주세요.",
          code: insertError.code || "UNKNOWN_ERROR",
          details: insertError.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(save, { status: 201 });
  } catch (error) {
    console.error("POST /api/saves error:", error);
    return NextResponse.json(
      {
        error: "저장에 실패했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/saves
 * 저장 취소
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

    // 4. 저장 제거
    const { error: deleteError } = await supabase
      .from("saves")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Save delete error:", deleteError);
      return NextResponse.json(
        { error: "저장 취소에 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/saves error:", error);
    return NextResponse.json(
      {
        error: "저장 취소에 실패했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/saves
 * 저장 상태 확인
 *
 * @param request - NextRequest 객체 (query params: postId)
 * @returns 저장 상태 (isSaved: boolean)
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

    // 4. 저장 상태 확인
    const { data: save, error: checkError } = await supabase
      .from("saves")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single();

    // 저장되지 않은 경우 (PGRST116 = no rows found)
    if (checkError && checkError.code === "PGRST116") {
      return NextResponse.json({ isSaved: false }, { status: 200 });
    }

    if (checkError) {
      console.error("Save check error:", checkError);
      return NextResponse.json(
        { error: "저장 상태 확인에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ isSaved: !!save }, { status: 200 });
  } catch (error) {
    console.error("GET /api/saves error:", error);
    return NextResponse.json(
      {
        error: "저장 상태 확인에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

