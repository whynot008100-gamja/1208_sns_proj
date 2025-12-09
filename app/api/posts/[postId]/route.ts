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
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/utils/supabase/server";
import { getServiceRoleClient } from "@/utils/supabase/service-role";
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
      title: postStat.title || null,
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
      { error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/posts/[postId]
 * 게시물 삭제
 *
 * @param request - NextRequest 객체
 * @param params - 경로 파라미터 (postId)
 * @returns 삭제 성공 메시지
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // 1. 인증 검증
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { postId } = await params;
    const supabase = await createClient();

    // 2. 게시물 조회
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id, user_id, image_url")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 3. Clerk User ID → Supabase User ID 변환
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 4. 소유권 확인 (본인만 삭제 가능)
    if (post.user_id !== currentUser.id) {
      return NextResponse.json(
        { error: "권한이 없습니다. 본인의 게시물만 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    // 5. Storage에서 이미지 삭제
    // image_url 형식: https://xxx.supabase.co/storage/v1/object/public/posts/filename.jpg
    let fileName: string | null = null;
    try {
      const urlParts = post.image_url.split("/posts/");
      if (urlParts.length > 1) {
        fileName = urlParts[1];
      }
    } catch (err) {
      console.error("Failed to extract filename from image_url:", err);
    }

    // Storage 삭제 시도 (실패해도 DB 삭제는 진행)
    if (fileName) {
      try {
        const serviceRoleClient = getServiceRoleClient();
        const { error: storageError } = await serviceRoleClient.storage
          .from("posts")
          .remove([fileName]);

        if (storageError) {
          console.error("Storage delete error:", storageError);
          // Storage 삭제 실패해도 DB 삭제는 진행
        }
      } catch (storageErr) {
        console.error("Storage deletion failed:", storageErr);
        // Storage 삭제 실패해도 DB 삭제는 진행
      }
    }

    // 6. 데이터베이스에서 게시물 삭제 (CASCADE로 관련 데이터 자동 삭제)
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      console.error("Post delete error:", deleteError);
      return NextResponse.json(
        { error: "게시물 삭제에 실패했습니다.", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "게시물이 삭제되었습니다." });
  } catch (error) {
    console.error("DELETE /api/posts/[postId] error:", error);
    return NextResponse.json(
      {
        error: "게시물 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}

