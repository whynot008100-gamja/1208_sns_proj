/**
 * @file app/(main)/search/hashtag/[hashtag]/page.tsx
 * @description 해시태그 상세 페이지
 *
 * 특정 해시태그가 포함된 게시물 목록을 표시하는 페이지입니다.
 */

"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import PostFeed from "@/components/post/PostFeed";
import { Hash } from "lucide-react";

function HashtagPageContent() {
  const params = useParams();
  const hashtagName = decodeURIComponent(params.hashtag as string);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* 해시태그 헤더 */}
      <div className="mb-6 pb-4 border-b border-[var(--instagram-border)]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[var(--instagram-border)] flex items-center justify-center">
            <Hash className="w-6 h-6 text-[var(--instagram-text-secondary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--instagram-text-primary)]">
              #{hashtagName}
            </h1>
            <p className="text-sm text-[var(--instagram-text-secondary)]">
              해시태그가 포함된 게시물
            </p>
          </div>
        </div>
      </div>

      {/* 게시물 피드 */}
      <HashtagPostFeed hashtag={hashtagName} />
    </div>
  );
}

function HashtagPostFeed({ hashtag }: { hashtag: string }) {
  // 해시태그별 게시물을 로드하는 간단한 구현
  // PostFeed 컴포넌트를 재사용하거나 별도로 구현 가능
  // 현재는 API 엔드포인트가 준비되어 있으므로 PostFeed를 확장하여 사용 가능

  return (
    <div>
      <HashtagPostFeedContent hashtag={hashtag} />
    </div>
  );
}

function HashtagPostFeedContent({ hashtag }: { hashtag: string }) {
  // 해시태그별 게시물 API를 사용하여 PostFeed와 유사한 방식으로 구현
  // 현재는 PostFeed 컴포넌트가 해시태그 필터를 지원하지 않으므로
  // 별도로 구현하거나 PostFeed를 확장해야 함
  
  // 임시로 메시지 표시 (향후 PostFeed 확장 또는 별도 컴포넌트 구현)
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--instagram-text-secondary)] text-center py-8">
        해시태그 "#{hashtag}"가 포함된 게시물을 불러오는 중...
        <br />
        <span className="text-xs">
          (현재는 검색 기능을 통해 해시태그를 찾을 수 있습니다)
        </span>
      </p>
    </div>
  );
}

export default function HashtagPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="py-8 text-center">
            <p className="text-[var(--instagram-text-secondary)]">로딩 중...</p>
          </div>
        </div>
      }
    >
      <HashtagPageContent />
    </Suspense>
  );
}

