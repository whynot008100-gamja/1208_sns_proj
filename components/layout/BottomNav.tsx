/**
 * @file components/layout/BottomNav.tsx
 * @description Instagram 스타일 모바일 하단 네비게이션 컴포넌트
 *
 * Mobile 전용 (<768px)
 * 높이: 50px
 * 5개 아이콘: 홈, 검색, 만들기, 좋아요, 프로필
 *
 * @see docs/PRD.md
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusSquare, Heart, User } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import CreatePostModal from "@/components/post/CreatePostModal";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive?: (pathname: string) => boolean;
}

export default function BottomNav() {
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
      href: "/likes",
      icon: Heart,
      label: "좋아요",
      isActive: (path) => path.startsWith("/likes"),
    },
    {
      href: user ? `/profile/${user.id}` : "/",
      icon: User,
      label: "프로필",
      isActive: (path) => path.startsWith("/profile"),
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[50px] bg-[var(--instagram-card-background)] border-t border-[var(--instagram-border)] z-50">
      <div className="flex items-center justify-around h-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive ? item.isActive(pathname) : false;

          // 만들기 버튼은 클릭 이벤트만
          if (item.href === "#") {
            return (
              <button
                key={item.label}
                className="flex flex-col items-center justify-center gap-1 text-[var(--instagram-text-primary)]"
                onClick={() => setIsCreateModalOpen(true)}
                aria-label={item.label}
              >
                <Icon className="w-6 h-6" />
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1"
              aria-label={item.label}
            >
              <Icon
                className={cn(
                  "w-6 h-6",
                  isActive
                    ? "text-[var(--instagram-text-primary)] stroke-[2.5px]"
                    : "text-[var(--instagram-text-secondary)]"
                )}
              />
            </Link>
          );
        })}
      </div>

      {/* 게시물 작성 모달 */}
      <CreatePostModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </nav>
  );
}

