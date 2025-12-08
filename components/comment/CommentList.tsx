/**
 * @file components/comment/CommentList.tsx
 * @description 댓글 목록 컴포넌트
 *
 * Instagram 스타일의 댓글 목록을 표시하는 컴포넌트입니다.
 * PostCard용으로 최신 2개만 표시하거나, 상세 모달용으로 전체 댓글을 표시할 수 있습니다.
 *
 * 주요 기능:
 * 1. 댓글 목록 렌더링
 * 2. PostCard용: 최신 2개만 표시
 * 3. 상세 모달용: 전체 댓글 + 스크롤
 * 4. 삭제 버튼 (본인만 표시)
 *
 * @see docs/PRD.md
 */

"use client";

import { memo } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { CommentWithUser } from "@/lib/types";

interface CommentListProps {
  comments: CommentWithUser[];
  postId: string;
  currentUserId?: string; // Supabase user_id
  limit?: number; // PostCard용: 2, 상세 모달용: undefined (전체)
  showAll?: boolean; // true: 전체 표시, false: limit만 표시
  onDelete?: (commentId: string) => void; // 삭제 콜백
}

function CommentList({
  comments,
  postId,
  currentUserId,
  limit = 2,
  showAll = false,
  onDelete,
}: CommentListProps) {
  // 표시할 댓글 목록 결정
  const displayComments = showAll
    ? comments
    : comments.slice(0, limit);

  // 댓글이 없을 때
  if (comments.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "space-y-1",
        showAll && "max-h-[400px] overflow-y-auto pr-2"
      )}
    >
      {displayComments.map((comment) => {
        const isOwner = currentUserId === comment.user_id;
        const canDelete = isOwner && onDelete;

        return (
          <div
            key={comment.id}
            className="flex items-start gap-2 group"
          >
            {/* 댓글 내용 */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--instagram-text-primary)]">
                <span className="font-semibold mr-1">
                  {comment.user.name}
                </span>
                <span>{comment.content}</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[var(--instagram-text-secondary)]">
                  {formatRelativeTime(comment.created_at)}
                </span>
                {canDelete && (
                  <button
                    onClick={() => onDelete?.(comment.id)}
                    className="text-xs text-[var(--instagram-text-secondary)] hover:text-[var(--instagram-like)] transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="댓글 삭제"
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>

            {/* 삭제 버튼 (더보기 메뉴) */}
            {canDelete && (
              <button
                onClick={() => onDelete?.(comment.id)}
                className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="댓글 삭제"
              >
                <MoreHorizontal className="w-4 h-4 text-[var(--instagram-text-secondary)]" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default memo(CommentList);

