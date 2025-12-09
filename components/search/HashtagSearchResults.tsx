/**
 * @file components/search/HashtagSearchResults.tsx
 * @description 해시태그 검색 결과 컴포넌트
 *
 * 해시태그 검색 결과를 표시하는 컴포넌트입니다.
 * 해시태그 이름, 게시물 수를 표시하고 클릭 시 해시태그 상세 페이지로 이동합니다.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Hash } from "lucide-react";
import type { HashtagStats } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HashtagSearchResultsProps {
  query: string;
  className?: string;
}

interface SearchHashtagsResponse {
  hashtags: HashtagStats[];
  hasMore: boolean;
}

export default function HashtagSearchResults({
  query,
  className,
}: HashtagSearchResultsProps) {
  const [hashtags, setHashtags] = useState<HashtagStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setHashtags([]);
      setHasMore(false);
      return;
    }

    const fetchHashtags = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/search/hashtags?q=${encodeURIComponent(query)}&limit=20`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "해시태그 검색에 실패했습니다.");
        }

        const data: SearchHashtagsResponse = await response.json();
        setHashtags(data.hashtags);
        setHasMore(data.hasMore);
      } catch (err) {
        console.error("Hashtag search error:", err);
        setError(
          err instanceof Error ? err.message : "해시태그 검색에 실패했습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHashtags();
  }, [query]);

  if (loading) {
    return (
      <div className={cn("py-8 text-center", className)}>
        <p className="text-[var(--instagram-text-secondary)]">검색 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("py-8 text-center", className)}>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!query.trim()) {
    return (
      <div className={cn("py-8 text-center", className)}>
        <p className="text-[var(--instagram-text-secondary)]">
          검색어를 입력하세요.
        </p>
      </div>
    );
  }

  if (hashtags.length === 0) {
    return (
      <div className={cn("py-8 text-center", className)}>
        <p className="text-[var(--instagram-text-secondary)]">
          검색 결과가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {hashtags.map((hashtag) => (
        <Link
          key={hashtag.hashtag_id}
          href={`/search/hashtag/${encodeURIComponent(hashtag.hashtag_name)}`}
          className="flex items-center gap-3 p-4 hover:bg-[var(--instagram-background)] transition-colors"
        >
          {/* 해시태그 아이콘 */}
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--instagram-border)] flex items-center justify-center">
            <Hash className="w-6 h-6 text-[var(--instagram-text-secondary)]" />
          </div>

          {/* 해시태그 정보 */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--instagram-text-primary)]">
              #{hashtag.hashtag_name}
            </p>
            <p className="text-sm text-[var(--instagram-text-secondary)]">
              게시물 {hashtag.posts_count.toLocaleString()}개
            </p>
          </div>
        </Link>
      ))}

      {hasMore && (
        <div className="py-4 text-center">
          <p className="text-sm text-[var(--instagram-text-secondary)]">
            더 많은 결과가 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}

