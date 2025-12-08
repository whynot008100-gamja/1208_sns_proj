/**
 * @file components/post/PostMenu.tsx
 * @description 게시물 메뉴 컴포넌트
 *
 * Instagram 스타일의 게시물 드롭다운 메뉴입니다.
 * 본인 게시물의 경우 "삭제" 옵션을 표시합니다.
 *
 * @see docs/PRD.md
 */

"use client";

import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface PostMenuProps {
  isOwner: boolean; // 본인 게시물인지 여부
  onDelete: () => void; // 삭제 버튼 클릭 시 콜백
}

export default function PostMenu({ isOwner, onDelete }: PostMenuProps) {
  // 본인 게시물이 아니면 메뉴를 표시하지 않음
  if (!isOwner) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity"
          aria-label="더보기"
        >
          <MoreHorizontal className="h-6 w-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={onDelete}
          className="text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          삭제
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

