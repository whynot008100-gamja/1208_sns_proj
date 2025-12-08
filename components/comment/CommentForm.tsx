/**
 * @file components/comment/CommentForm.tsx
 * @description 댓글 작성 폼 컴포넌트
 *
 * Instagram 스타일의 댓글 작성 폼입니다.
 * Enter 키 또는 "게시" 버튼으로 댓글을 제출할 수 있습니다.
 *
 * 주요 기능:
 * 1. 댓글 입력 필드
 * 2. Enter 키 제출
 * 3. "게시" 버튼
 * 4. 제출 처리
 *
 * @see docs/PRD.md
 */

"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommentFormProps {
  postId: string;
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  autoFocus?: boolean;
}

const MAX_COMMENT_LENGTH = 1000;

function CommentForm({
  postId,
  onSubmit,
  placeholder = "댓글 달기...",
  autoFocus = false,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 자동 포커스
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // 제출 핸들러
  const handleSubmit = useCallback(async () => {
    const trimmedContent = content.trim();

    // 빈 댓글 검증
    if (!trimmedContent) {
      setError("댓글을 입력해주세요.");
      return;
    }

    // 최대 길이 검증
    if (trimmedContent.length > MAX_COMMENT_LENGTH) {
      setError(`댓글은 ${MAX_COMMENT_LENGTH}자 이하여야 합니다.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(trimmedContent);
      // 성공 시 입력 필드 초기화
      setContent("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (err) {
      console.error("Comment submit error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "댓글 작성에 실패했습니다. 다시 시도해주세요."
      );
    } finally {
      setSubmitting(false);
    }
  }, [content, onSubmit]);

  // Enter 키 핸들러
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="border-t border-[var(--instagram-border)] px-4 py-3">
      {/* 에러 메시지 */}
      {error && (
        <div id="comment-error" className="mb-2 text-xs text-red-500" role="alert">
          {error}
        </div>
      )}

      {/* 입력 폼 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex items-center gap-2"
      >
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={content}
          onChange={(e) => {
            const value = e.target.value;
            if (value.length <= MAX_COMMENT_LENGTH) {
              setContent(value);
              setError(null);
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={submitting}
          className={cn(
            "flex-1 border-0 bg-transparent px-0 py-0 text-sm",
            "focus-visible:ring-0 focus-visible:ring-offset-0",
            "placeholder:text-[var(--instagram-text-secondary)]"
          )}
          maxLength={MAX_COMMENT_LENGTH}
          aria-label="댓글 입력"
          aria-describedby={error ? "comment-error" : undefined}
          aria-invalid={!!error}
        />
        <Button
          type="submit"
          disabled={!content.trim() || submitting}
          className={cn(
            "h-auto px-2 py-1 text-sm font-semibold",
            content.trim()
              ? "text-[var(--instagram-blue)] hover:text-[var(--instagram-blue)]/80"
              : "text-[var(--instagram-text-secondary)] cursor-not-allowed"
          )}
          variant="ghost"
          aria-label="댓글 게시"
          aria-busy={submitting}
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "게시"
          )}
        </Button>
      </form>
    </div>
  );
}

export default memo(CommentForm);

