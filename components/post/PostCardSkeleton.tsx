/**
 * @file components/post/PostCardSkeleton.tsx
 * @description 게시물 카드 로딩 스켈레톤 UI
 *
 * PostCard와 동일한 레이아웃 구조를 가진 스켈레톤 컴포넌트입니다.
 * Shimmer 효과를 포함합니다.
 *
 * @see components/post/PostCard.tsx
 */

export default function PostCardSkeleton() {
  return (
    <div className="bg-[var(--instagram-card-background)] border-b border-[var(--instagram-border)]">
      {/* 헤더 스켈레톤 */}
      <div className="flex items-center justify-between px-4 py-3 h-[60px]">
        <div className="flex items-center gap-3">
          {/* 프로필 이미지 스켈레톤 */}
          <div className="w-8 h-8 rounded-full animate-shimmer" />
          {/* 사용자명 스켈레톤 */}
          <div className="h-4 w-24 rounded animate-shimmer" />
        </div>
        {/* 메뉴 스켈레톤 */}
        <div className="w-6 h-6 rounded animate-shimmer" />
      </div>

      {/* 이미지 스켈레톤 */}
      <div className="w-full h-[400px] animate-shimmer" />

      {/* 액션 버튼 스켈레톤 */}
      <div className="flex items-center justify-between px-4 py-3 h-[48px]">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 rounded animate-shimmer" />
          <div className="w-6 h-6 rounded animate-shimmer" />
          <div className="w-6 h-6 rounded animate-shimmer" />
        </div>
        <div className="w-6 h-6 rounded animate-shimmer" />
      </div>

      {/* 컨텐츠 스켈레톤 */}
      <div className="px-4 pb-4 space-y-2">
        {/* 좋아요 수 스켈레톤 */}
        <div className="h-4 w-32 rounded animate-shimmer" />
        
        {/* 캡션 스켈레톤 */}
        <div className="space-y-1">
          <div className="h-4 w-full rounded animate-shimmer" />
          <div className="h-4 w-3/4 rounded animate-shimmer" />
        </div>

        {/* 댓글 미리보기 스켈레톤 */}
        <div className="space-y-1 pt-2">
          <div className="h-3 w-24 rounded animate-shimmer" />
          <div className="h-4 w-full rounded animate-shimmer" />
          <div className="h-4 w-5/6 rounded animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

