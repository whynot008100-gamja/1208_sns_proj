/**
 * @file components/layout/Header.tsx
 * @description Instagram 스타일 모바일 헤더 컴포넌트
 *
 * Mobile 전용 (<768px)
 * 높이: 60px
 * 로고 + 알림/DM/프로필 아이콘
 *
 * @see docs/PRD.md
 */

"use client";

import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export default function Header() {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-[60px] bg-[var(--instagram-card-background)] border-b border-[var(--instagram-border)] z-50">
      <div className="flex items-center justify-between h-full px-4">
        {/* 좌측: 로고 */}
        <Link href="/" className="text-xl font-bold">
          Instagram
        </Link>

        {/* 우측: 아이콘들 */}
        <div className="flex items-center gap-4">
          {/* 알림 (1차 제외, UI만) */}
          <button
            className="text-[var(--instagram-text-primary)]"
            onClick={() => {
              // TODO: 알림 페이지로 이동 (1차 제외)
            }}
            aria-label="알림"
            disabled
          >
            <Heart className="w-6 h-6" />
          </button>

          {/* DM (1차 제외, UI만) */}
          <button
            className="text-[var(--instagram-text-primary)]"
            onClick={() => {
              // TODO: DM 페이지로 이동 (1차 제외)
            }}
            aria-label="메시지"
            disabled
          >
            <MessageCircle className="w-6 h-6" />
          </button>

          {/* 프로필 */}
          <UserButton />
        </div>
      </div>
    </header>
  );
}

