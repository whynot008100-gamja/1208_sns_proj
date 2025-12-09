/**
 * @file components/search/SearchCategoryTabs.tsx
 * @description 검색 카테고리 탭 컴포넌트
 *
 * 검색 카테고리를 전환하는 탭 UI입니다.
 * URL 쿼리 파라미터와 동기화됩니다.
 */

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export type SearchCategory = "users" | "hashtags" | "posts";

interface SearchCategoryTabsProps {
  activeCategory: SearchCategory;
  className?: string;
}

const categories: { id: SearchCategory; label: string }[] = [
  { id: "users", label: "사용자" },
  { id: "hashtags", label: "해시태그" },
  { id: "posts", label: "게시물" },
];

export default function SearchCategoryTabs({
  activeCategory,
  className,
}: SearchCategoryTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCategoryChange = (category: SearchCategory) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", category);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div
      className={cn(
        "flex border-b border-[var(--instagram-border)]",
        className
      )}
      role="tablist"
      aria-label="검색 카테고리"
    >
      {categories.map((category) => {
        const isActive = activeCategory === category.id;
        return (
          <button
            key={category.id}
            onClick={() => handleCategoryChange(category.id)}
            role="tab"
            aria-selected={isActive}
            aria-controls={`search-results-${category.id}`}
            className={cn(
              "flex-1 py-3 text-sm font-semibold transition-colors",
              "hover:text-[var(--instagram-text-primary)]",
              isActive
                ? "text-[var(--instagram-text-primary)] border-b-2 border-[var(--instagram-text-primary)]"
                : "text-[var(--instagram-text-secondary)]"
            )}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}

