/**
 * @file app/(main)/search/page.tsx
 * @description 검색 페이지
 *
 * 사용자, 해시태그, 게시물을 검색할 수 있는 페이지입니다.
 * 카테고리별 탭으로 검색 결과를 전환할 수 있습니다.
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SearchInput from "@/components/search/SearchInput";
import SearchCategoryTabs, {
  type SearchCategory,
} from "@/components/search/SearchCategoryTabs";
import UserSearchResults from "@/components/search/UserSearchResults";
import HashtagSearchResults from "@/components/search/HashtagSearchResults";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState<SearchCategory>(
    (searchParams.get("category") as SearchCategory) || "users"
  );

  // URL 쿼리 파라미터 변경 감지
  useEffect(() => {
    const urlQuery = searchParams.get("q") || "";
    const urlCategory = (searchParams.get("category") as SearchCategory) || "users";
    setQuery(urlQuery);
    setCategory(urlCategory);
  }, [searchParams]);

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    // URL 업데이트 (debounce는 SearchInput에서 처리)
    const params = new URLSearchParams(searchParams.toString());
    if (newQuery.trim()) {
      params.set("q", newQuery);
    } else {
      params.delete("q");
    }
    window.history.replaceState(
      {},
      "",
      `/search?${params.toString()}`
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* 검색 입력창 */}
      <div className="mb-6">
        <SearchInput
          value={query}
          onChange={handleQueryChange}
          placeholder="검색..."
        />
      </div>

      {/* 카테고리 탭 */}
      <SearchCategoryTabs activeCategory={category} />

      {/* 검색 결과 */}
      <div className="mt-6">
        {category === "users" && <UserSearchResults query={query} />}
        {category === "hashtags" && <HashtagSearchResults query={query} />}
        {category === "posts" && (
          <div className="py-8 text-center">
            <p className="text-[var(--instagram-text-secondary)]">
              게시물 검색 기능은 곧 제공될 예정입니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="py-8 text-center">
            <p className="text-[var(--instagram-text-secondary)]">로딩 중...</p>
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
