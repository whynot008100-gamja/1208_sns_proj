/**
 * @file components/post/EditPostModal.tsx
 * @description 게시물 수정 모달 컴포넌트
 *
 * Instagram 스타일의 게시물 수정 모달입니다.
 * 게시물의 제목과 캡션을 수정할 수 있습니다.
 *
 * 주요 기능:
 * 1. 제목 수정
 * 2. 캡션 수정
 * 3. API를 통한 게시물 업데이트
 *
 * @see docs/PRD.md
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PostWithStats } from "@/lib/types";

interface EditPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: PostWithStats;
  onSuccess?: (updatedPost: PostWithStats) => void;
}

const MAX_CAPTION_LENGTH = 2200;

export default function EditPostModal({
  open,
  onOpenChange,
  post,
  onSuccess,
}: EditPostModalProps) {
  const [title, setTitle] = useState(post.title || "");
  const [caption, setCaption] = useState(post.caption || "");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 모달이 열릴 때마다 현재 게시물 데이터로 초기화
  useEffect(() => {
    if (open) {
      setTitle(post.title || "");
      setCaption(post.caption || "");
      setError(null);
    }
  }, [open, post.title, post.caption]);

  // 수정 핸들러
  const handleUpdate = useCallback(async () => {
    setUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim() || null,
          caption: caption.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Update API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(
          errorData.error || `게시물 수정에 실패했습니다. (${response.status})`
        );
      }

      const updatedPost: PostWithStats = await response.json();

      // 성공 콜백 호출
      onSuccess?.(updatedPost);

      // 모달 닫기
      onOpenChange(false);
    } catch (err) {
      console.error("Update error:", err);
      let errorMessage = "게시물 수정에 실패했습니다. 다시 시도해주세요.";
      
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        errorMessage = "인터넷 연결을 확인해주세요.";
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setUpdating(false);
    }
  }, [post.id, title, caption, onSuccess, onOpenChange]);

  // 모달 닫기 핸들러
  const handleClose = useCallback(() => {
    if (updating) return; // 수정 중에는 닫기 불가

    setTitle(post.title || "");
    setCaption(post.caption || "");
    setError(null);
    onOpenChange(false);
  }, [updating, post.title, post.caption, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold">
            게시물 수정
          </DialogTitle>
          <DialogDescription className="sr-only">
            게시물의 제목과 캡션을 수정하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 제목 입력 */}
          <div className="space-y-2">
            <label
              htmlFor="edit-title"
              className="text-sm font-medium text-[var(--instagram-text-primary)]"
            >
              제목
            </label>
            <Input
              id="edit-title"
              placeholder="제목을 입력하세요... (선택사항)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base"
              aria-label="게시물 제목 수정"
            />
          </div>

          {/* 캡션 입력 */}
          <div className="space-y-2">
            <label
              htmlFor="edit-caption"
              className="text-sm font-medium text-[var(--instagram-text-primary)]"
            >
              캡션
            </label>
            <Textarea
              id="edit-caption"
              placeholder="캡션을 입력하세요..."
              value={caption}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= MAX_CAPTION_LENGTH) {
                  setCaption(value);
                }
              }}
              className="min-h-[120px] resize-none"
              maxLength={MAX_CAPTION_LENGTH}
              aria-label="게시물 캡션 수정"
              aria-describedby={error ? "edit-error" : "edit-caption-length"}
            />
            <div className="flex justify-end">
              <span
                id="edit-caption-length"
                className={cn(
                  "text-xs text-[var(--instagram-text-secondary)]",
                  caption.length >= MAX_CAPTION_LENGTH && "text-red-500"
                )}
                aria-live="polite"
              >
                {caption.length} / {MAX_CAPTION_LENGTH}
              </span>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div
              className="px-4 py-3 bg-red-50 border border-red-200 rounded-md"
              role="alert"
            >
              <p id="edit-error" className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={updating}
              aria-label="취소"
            >
              취소
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updating}
              className="bg-[var(--instagram-blue)] hover:bg-[var(--instagram-blue)]/90 text-white disabled:opacity-50"
              aria-label="수정 완료"
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  수정 중...
                </>
              ) : (
                "수정 완료"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

