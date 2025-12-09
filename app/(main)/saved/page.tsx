/**
 * @file app/(main)/saved/page.tsx
 * @description 저장된 게시물 페이지
 *
 * 현재 로그인한 사용자가 저장한 게시물을 표시하는 페이지입니다.
 * PostFeed 컴포넌트를 사용하여 저장된 게시물 목록을 표시합니다.
 *
 * @see docs/PRD.md
 */

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import PostFeed from "@/components/post/PostFeed";

export default async function SavedPage() {
  // 인증 확인
  const { userId } = await auth();
  
  if (!userId) {
    // 로그인하지 않은 경우 홈으로 리다이렉트
    redirect("/");
  }

  return (
    <div className="py-4">
      {/* 페이지 헤더 */}
      <div className="mb-6 px-4">
        <h1 className="text-2xl font-semibold text-[var(--instagram-text-primary)]">
          저장됨
        </h1>
        <p className="text-sm text-[var(--instagram-text-secondary)] mt-1">
          저장한 게시물을 확인하세요
        </p>
      </div>

      {/* 저장된 게시물 피드 */}
      <PostFeed saved={true} />
    </div>
  );
}

