/**
 * @file app/(main)/page.tsx
 * @description 홈 피드 페이지
 *
 * Instagram 스타일의 게시물 피드를 표시하는 메인 페이지입니다.
 * PostFeed 컴포넌트를 사용하여 게시물 목록을 표시합니다.
 *
 * @see docs/PRD.md
 */

import PostFeed from "@/components/post/PostFeed";

export default function HomePage() {
  return (
    <div className="py-4">
      <PostFeed />
    </div>
  );
}

