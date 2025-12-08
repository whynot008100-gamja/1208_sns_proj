/**
 * @file components/post/DeletePostDialog.tsx
 * @description 게시물 삭제 확인 다이얼로그
 *
 * Instagram 스타일의 게시물 삭제 확인 다이얼로그입니다.
 * 사용자에게 삭제 확인을 요청하고, 확인 시 API를 호출합니다.
 *
 * @see docs/PRD.md
 */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeletePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  onDelete: () => void; // 삭제 성공 시 콜백
}

export default function DeletePostDialog({
  open,
  onOpenChange,
  postId,
  onDelete,
}: DeletePostDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "게시물 삭제에 실패했습니다.");
      }

      // 성공 시 다이얼로그 닫기 및 콜백 호출
      onOpenChange(false);
      onDelete();
    } catch (error) {
      console.error("Delete post error:", error);
      alert(
        error instanceof Error ? error.message : "게시물 삭제에 실패했습니다."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>게시물 삭제</DialogTitle>
          <DialogDescription>
            이 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "삭제 중..." : "삭제"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

