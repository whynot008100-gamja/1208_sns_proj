/**
 * @file components/post/PostCard.tsx
 * @description Instagram 스타일 게시물 카드 컴포넌트
 *
 * 게시물의 모든 정보를 표시하는 카드 컴포넌트입니다.
 * 헤더, 이미지, 액션 버튼, 좋아요 수, 캡션, 댓글 미리보기를 포함합니다.
 *
 * @see docs/PRD.md
 */

"use client";

import { useState, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { PostWithStats, User } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: PostWithStats;
  user?: User;
  currentUserId?: string;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
}

function PostCard({
  post,
  user,
  currentUserId,
  onLike,
  onComment,
}: PostCardProps) {
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [isLiked, setIsLiked] = useState(false); // 1차 제외 - UI만

  // 캡션 2줄 초과 여부 확인 (간단한 구현)
  const captionLines = post.caption?.split("\n") || [];
  const shouldTruncate = captionLines.length > 2 || (post.caption?.length || 0) > 100;
  const displayCaption = showFullCaption
    ? post.caption
    : shouldTruncate
    ? post.caption?.substring(0, 100) + "..."
    : post.caption;

  // 댓글 미리보기 (최신 2개) - 1차 제외, UI만 표시
  const showCommentsPreview = post.comments_count > 2;

  return (
    <article className="bg-[var(--instagram-card-background)] border-b border-[var(--instagram-border)] mb-4">
      {/* 헤더 (60px 높이) */}
      <header className="flex items-center justify-between px-4 py-3 h-[60px]">
        <div className="flex items-center gap-3">
          {/* 프로필 이미지: 32px 원형 */}
          <Link href={user ? `/profile/${user.id}` : "#"}>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {user?.name ? (
                <span className="text-xs font-semibold text-gray-600">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <div className="w-full h-full bg-gray-300" />
              )}
            </div>
          </Link>

          {/* 사용자명: Bold */}
          <Link
            href={user ? `/profile/${user.id}` : "#"}
            className="font-semibold text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity"
          >
            {user?.name || "Unknown"}
          </Link>

          {/* 시간: 작고 회색 */}
          <span className="text-xs text-[var(--instagram-text-secondary)]">
            {formatRelativeTime(post.created_at)}
          </span>
        </div>

        {/* ⋯ 메뉴: 우측 정렬 */}
        <button
          className="text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity"
          aria-label="더보기"
          onClick={() => {
            // TODO: 드롭다운 메뉴 (1차 제외)
            console.log("메뉴 열기");
          }}
        >
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </header>

      {/* 이미지 영역 (1:1 정사각형) */}
      <div className="relative w-full aspect-square bg-gray-100">
        <Image
          src={post.image_url}
          alt={post.caption || "게시물 이미지"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 630px"
          priority={false}
          loading="lazy"
          onDoubleClick={() => {
            // TODO: 더블탭 좋아요 (1차 제외 - UI만)
            if (!isLiked) {
              setIsLiked(true);
              onLike?.(post.id);
            }
          }}
        />
      </div>

      {/* 액션 버튼 (48px 높이) */}
      <div className="flex items-center justify-between px-4 py-3 h-[48px]">
        <div className="flex items-center gap-4">
          {/* 좋아요 버튼 */}
          <button
            className={cn(
              "transition-transform active:scale-125",
              isLiked
                ? "text-[var(--instagram-like)]"
                : "text-[var(--instagram-text-primary)]"
            )}
            onClick={() => {
              setIsLiked(!isLiked);
              onLike?.(post.id);
            }}
            aria-label={isLiked ? "좋아요 취소" : "좋아요"}
          >
            <Heart
              className={cn("w-6 h-6", isLiked && "fill-current")}
              strokeWidth={isLiked ? 0 : 2}
            />
          </button>

          {/* 댓글 버튼 */}
          <button
            className="text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity"
            onClick={() => {
              onComment?.(post.id);
            }}
            aria-label="댓글"
          >
            <MessageCircle className="w-6 h-6" />
          </button>

          {/* 공유 버튼 (UI만, 1차 제외) */}
          <button
            className="text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity"
            aria-label="공유"
            disabled
          >
            <Send className="w-6 h-6" />
          </button>
        </div>

        {/* 북마크 버튼 (UI만, 1차 제외) */}
        <button
          className="text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity"
          aria-label="저장"
          disabled
        >
          <Bookmark className="w-6 h-6" />
        </button>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="px-4 pb-4 space-y-2">
        {/* 좋아요 수: Bold */}
        {post.likes_count > 0 && (
          <div className="font-semibold text-[var(--instagram-text-primary)]">
            좋아요 {post.likes_count.toLocaleString()}개
          </div>
        )}

        {/* 캡션: 사용자명 Bold + 내용 */}
        {post.caption && (
          <div className="text-[var(--instagram-text-primary)]">
            <Link
              href={user ? `/profile/${user.id}` : "#"}
              className="font-semibold hover:opacity-70 transition-opacity mr-2"
            >
              {user?.name || "Unknown"}
            </Link>
            <span className="whitespace-pre-wrap">{displayCaption}</span>
            {shouldTruncate && !showFullCaption && (
              <button
                className="text-[var(--instagram-text-secondary)] hover:text-[var(--instagram-text-primary)] ml-1"
                onClick={() => setShowFullCaption(true)}
              >
                ... 더 보기
              </button>
            )}
          </div>
        )}

        {/* 댓글 미리보기 */}
        {showCommentsPreview && (
          <button
            className="text-[var(--instagram-text-secondary)] text-sm hover:text-[var(--instagram-text-primary)] transition-colors"
            onClick={() => {
              // TODO: 댓글 상세 모달 열기 (1차 제외)
              onComment?.(post.id);
            }}
          >
            댓글 {post.comments_count}개 모두 보기
          </button>
        )}

        {/* 댓글 미리보기 (최신 2개) - 1차 제외, UI만 표시 */}
        {post.comments_count > 0 && post.comments_count <= 2 && (
          <div className="text-sm text-[var(--instagram-text-primary)] space-y-1">
            <div>
              <span className="font-semibold">username2</span>{" "}
              <span>멋진 사진이네요!</span>
            </div>
            <div>
              <span className="font-semibold">username3</span>{" "}
              <span>좋아요 👍</span>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

// React.memo로 최적화 (props가 변경되지 않으면 리렌더링 방지)
export default memo(PostCard);

