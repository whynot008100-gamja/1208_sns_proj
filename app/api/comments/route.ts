/**
 * @file app/api/comments/route.ts
 * @description 댓글 API
 *
 * GET: 댓글 목록 조회
 * POST: 댓글 작성
 * DELETE: 댓글 삭제 (본인만)
 *
 * @see docs/PRD.md
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/utils/supabase/server";
import type { CommentWithUser } from "@/lib/types";

/**
 * GET /api/comments
 * 댓글 목록 조회
 *
 * @param request - NextRequest 객체
 * @returns 댓글 목록
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const postId = searchParams.get("postId");
    if (!postId) {
      return NextResponse.json(
        { error: "postId 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    // 댓글 조회 (users 테이블과 JOIN)
    let query = supabase
      .from("comments")
      .select(
        `
        id,
        post_id,
        user_id,
        content,
        created_at,
        updated_at,
        users (
          id,
          clerk_id,
          name,
          created_at
        )
      `
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: true }); // 시간 순서대로 (최신이 아래)

    if (limit) {
      const limitNum = parseInt(limit, 10);
      const offsetNum = offset ? parseInt(offset, 10) : 0;
      query = query.range(offsetNum, offsetNum + limitNum - 1);
    }

    const { data: comments, error: commentsError } = await query;

    if (commentsError) {
      console.error("Comments query error:", commentsError);
      return NextResponse.json(
        { error: "댓글을 불러오는데 실패했습니다.", details: commentsError.message },
        { status: 500 }
      );
    }

    // CommentWithUser 형식으로 변환
    const commentsWithUser: CommentWithUser[] = (comments || [])
      .filter((comment: any) => comment.users) // users가 없는 댓글 제외
      .map((comment: any) => ({
        id: comment.id,
        post_id: comment.post_id,
        user_id: comment.user_id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        user: Array.isArray(comment.users) ? comment.users[0] : comment.users,
      }));

    return NextResponse.json({ comments: commentsWithUser });
  } catch (error) {
    console.error("Comments API GET error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/comments
 * 댓글 작성
 *
 * @param request - NextRequest 객체
 * @returns 생성된 댓글 데이터
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

    // 2. 요청 데이터 파싱
    const body = await request.json();
    const { postId, content } = body;

    if (!postId || !content) {
      return NextResponse.json(
        { error: "postId와 content가 필요합니다." },
        { status: 400 }
      );
    }

    // content 검증
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return NextResponse.json(
        { error: "댓글 내용이 비어있습니다." },
        { status: 400 }
      );
    }

    if (trimmedContent.length > 1000) {
      return NextResponse.json(
        { error: "댓글은 1000자 이하여야 합니다." },
        { status: 400 }
      );
    }

    // 3. Clerk User ID → Supabase User ID 변환
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

    // 4. 댓글 저장
    const { data: comment, error: insertError } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        user_id: user.id,
        content: trimmedContent,
      })
      .select()
      .single();

    if (insertError || !comment) {
      console.error("Comment insert error:", insertError);
      return NextResponse.json(
        { error: "댓글 작성에 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }

    // 5. 사용자 정보 조회
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .eq("id", user.id)
      .single();

    if (userDataError || !userData) {
      console.error("User data fetch error:", userDataError);
      return NextResponse.json(
        { error: "사용자 정보를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }

    // 6. CommentWithUser 형식으로 반환
    const commentWithUser: CommentWithUser = {
      ...comment,
      user: userData,
    };

    return NextResponse.json(commentWithUser, { status: 201 });
  } catch (error) {
    console.error("Comments API POST error:", error);
    return NextResponse.json(
      {
        error: "댓글 작성에 실패했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/comments
 * 댓글 삭제 (본인만)
 *
 * @param request - NextRequest 객체
 * @returns 삭제 성공 메시지
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

    // 2. 요청 데이터 파싱
    const searchParams = request.nextUrl.searchParams;
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json(
        { error: "commentId 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    // 3. 댓글 조회 및 소유권 확인
    const supabase = await createClient();

    // 댓글 조회
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .select("id, user_id")
      .eq("id", commentId)
      .single();

    if (commentError || !comment) {
      return NextResponse.json(
        { error: "댓글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Clerk User ID → Supabase User ID 변환
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 소유권 확인
    if (comment.user_id !== user.id) {
      return NextResponse.json(
        { error: "권한이 없습니다. 본인의 댓글만 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    // 4. 댓글 삭제
    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (deleteError) {
      console.error("Comment delete error:", deleteError);
      return NextResponse.json(
        { error: "댓글 삭제에 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "댓글이 삭제되었습니다." });
  } catch (error) {
    console.error("Comments API DELETE error:", error);
    return NextResponse.json(
      {
        error: "댓글 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}

