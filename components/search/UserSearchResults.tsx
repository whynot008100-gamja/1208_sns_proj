/**
 * @file components/search/UserSearchResults.tsx
 * @description 사용자 검색 결과 컴포넌트
 *
 * 사용자 검색 결과를 표시하는 컴포넌트입니다.
 * 프로필 이미지, 이름, 팔로우 버튼을 포함합니다.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import type { UserWithStats } from "@/lib/types";
import FollowButton from "@/components/profile/FollowButton";
import { cn } from "@/lib/utils";

interface UserSearchResultsProps {
  query: string;
  className?: string;
}

interface SearchUsersResponse {
  users: UserWithStats[];
  hasMore: boolean;
}

export default function UserSearchResults({
  query,
  className,
}: UserSearchResultsProps) {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      setHasMore(false);
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/search/users?q=${encodeURIComponent(query)}&limit=20`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "사용자 검색에 실패했습니다.");
        }

        const data: SearchUsersResponse = await response.json();
        setUsers(data.users);
        setHasMore(data.hasMore);
      } catch (err) {
        console.error("User search error:", err);
        setError(
          err instanceof Error ? err.message : "사용자 검색에 실패했습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
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

  if (users.length === 0) {
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
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center gap-3 p-4 hover:bg-[var(--instagram-background)] transition-colors"
        >
          {/* 프로필 이미지 */}
          <Link
            href={`/profile/${user.clerk_id}`}
            className="flex-shrink-0"
            aria-label={`${user.name}의 프로필`}
          >
            <div className="w-12 h-12 rounded-full bg-[var(--instagram-border)] flex items-center justify-center overflow-hidden">
              <User className="w-6 h-6 text-[var(--instagram-text-secondary)]" />
            </div>
          </Link>

          {/* 사용자 정보 */}
          <div className="flex-1 min-w-0">
            <Link
              href={`/profile/${user.clerk_id}`}
              className="block hover:opacity-70 transition-opacity"
            >
              <p className="font-semibold text-[var(--instagram-text-primary)] truncate">
                {user.name}
              </p>
              <p className="text-sm text-[var(--instagram-text-secondary)]">
                게시물 {user.posts_count}개 · 팔로워 {user.followers_count}명
              </p>
            </Link>
          </div>

          {/* 팔로우 버튼 */}
          <div className="flex-shrink-0">
            <FollowButton
              followingId={user.id}
              initialIsFollowing={false}
              onFollowChange={() => {
                // 팔로우 상태 변경 시 목록 새로고침 (선택사항)
              }}
            />
          </div>
        </div>
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

