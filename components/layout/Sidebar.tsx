/**
 * @file components/layout/Sidebar.tsx
 * @description Instagram 스타일 사이드바 컴포넌트
 *
 * Desktop: 244px 너비, 아이콘 + 텍스트
 * Tablet: 72px 너비, 아이콘만
 * Mobile: 숨김
 *
 * @see docs/PRD.md
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusSquare, User } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import CreatePostModal from "@/components/post/CreatePostModal";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive?: (pathname: string) => boolean;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      href: "/",
      icon: Home,
      label: "홈",
      isActive: (path) => path === "/",
    },
    {
      href: "/search",
      icon: Search,
      label: "검색",
      isActive: (path) => path.startsWith("/search"),
    },
    {
      href: "#",
      icon: PlusSquare,
      label: "만들기",
      isActive: () => false, // 모달 열기 (1차 제외)
    },
    {
      href: user ? `/profile/${user.id}` : "/",
      icon: User,
      label: "프로필",
      isActive: (path) => path.startsWith("/profile"),
    },
  ];

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen bg-[var(--instagram-card-background)] border-r border-[var(--instagram-border)] z-40">
      {/* Desktop: 244px, Tablet: 72px */}
      <div className="w-[244px] md:w-[72px] lg:w-[244px] flex flex-col pt-8 px-3">
        {/* 로고 영역 (Desktop만 표시) */}
        <div className="hidden lg:block mb-8 px-3">
          <Link href="/" className="text-2xl font-bold">
            Instagram
          </Link>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isActive ? item.isActive(pathname) : false;

            // 만들기 버튼은 클릭 이벤트만
            if (item.href === "#") {
              return (
                <button
                  key={item.label}
                  className={cn(
                    "flex items-center gap-4 px-3 py-3 rounded-lg transition-colors",
                    "hover:bg-gray-50",
                    "text-[var(--instagram-text-primary)]"
                  )}
                  onClick={() => setIsCreateModalOpen(true)}
                  aria-label={item.label}
                >
                  <Icon className="w-6 h-6" />
                  <span className="hidden lg:inline text-base font-medium">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-3 py-3 rounded-lg transition-colors",
                  "hover:bg-gray-50",
                  isActive
                    ? "font-semibold text-[var(--instagram-text-primary)]"
                    : "text-[var(--instagram-text-primary)]"
                )}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "w-6 h-6",
                    isActive && "stroke-[2.5px]"
                  )}
                />
                <span className="hidden lg:inline text-base">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 게시물 작성 모달 */}
      <CreatePostModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </aside>
  );
}

