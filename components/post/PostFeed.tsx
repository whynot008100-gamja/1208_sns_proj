/**
 * @file components/post/PostFeed.tsx
 * @description 게시물 피드 컴포넌트
 *
 * 게시물 목록을 표시하고 무한 스크롤을 지원하는 컴포넌트입니다.
 * Intersection Observer를 사용하여 하단 도달 시 자동으로 다음 페이지를 로드합니다.
 *
 * @see docs/PRD.md
 */

"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import PostCard from "./PostCard";
import PostCardSkeleton from "./PostCardSkeleton";
import type { PostWithStats, User } from "@/lib/types";

interface PostFeedProps {
  userId?: string; // 특정 사용자의 게시물만 표시 (프로필 페이지용)
  initialPosts?: PostWithStats[];
  onRefresh?: (refreshFn: () => void) => void; // 외부에서 refresh 함수를 받을 수 있도록
}

interface PostsResponse {
  posts: PostWithStats[];
  hasMore: boolean;
  users?: User[];
}

export default function PostFeed({
  userId,
  initialPosts = [],
  onRefresh,
}: PostFeedProps) {
  const [posts, setPosts] = useState<PostWithStats[]>(initialPosts);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [loading, setLoading] = useState(initialPosts.length === 0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(initialPosts.length);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // 게시물 로드 함수
  const loadPosts = useCallback(
    async (currentOffset: number, replace: boolean = false) => {
      if (loadingRef.current) return;

      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          limit: "10",
          offset: currentOffset.toString(),
        });

        if (userId) {
          params.append("userId", userId);
        }

        const response = await fetch(`/api/posts?${params.toString()}`);
        if (!response.ok) {
          throw new Error("게시물을 불러오는데 실패했습니다.");
        }

        const data: PostsResponse = await response.json();

        if (data.posts.length === 0) {
          setHasMore(false);
        } else {
          if (replace) {
            setPosts(data.posts);
          } else {
            setPosts((prev) => [...prev, ...data.posts]);
          }
          setHasMore(data.hasMore);

          // 사용자 정보 맵 업데이트
          if (data.users) {
            setUsers((prev) => {
              const newMap = new Map(prev);
              data.users!.forEach((user) => {
                newMap.set(user.id, user);
              });
              return newMap;
            });
          }
        }
      } catch (err) {
        console.error("Load posts error:", err);
        setError(
          err instanceof Error ? err.message : "게시물을 불러오는데 실패했습니다."
        );
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [userId]
  );

  // 피드 새로고침 함수
  const refreshFeed = useCallback(() => {
    setOffset(0);
    setPosts([]);
    loadPosts(0, true);
  }, [loadPosts]);

  // onRefresh 콜백에 refreshFeed 함수 전달
  useEffect(() => {
    if (onRefresh) {
      onRefresh(refreshFeed);
    }
  }, [onRefresh, refreshFeed]);

  // 초기 로드
  useEffect(() => {
    if (initialPosts.length === 0) {
      loadPosts(0, false);
    }
  }, [loadPosts, initialPosts.length]);

  // Intersection Observer 설정
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextOffset = offset;
          setOffset(nextOffset + 10);
          loadPosts(nextOffset, false);
        }
      },
      {
        rootMargin: "100px", // 하단 100px 전에 미리 로드
      }
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loading, offset, loadPosts]);

  // 좋아요 핸들러
  const handleLike = useCallback((postId: string) => {
    // TODO: 좋아요 API 호출 (1차 제외 - UI만)
    console.log("Like post:", postId);
  }, []);

  // 댓글 핸들러
  const handleComment = useCallback((postId: string) => {
    // TODO: 댓글 모달 열기 (1차 제외)
    console.log("Comment on post:", postId);
  }, []);

  // 에러 상태
  if (error && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <p className="text-[var(--instagram-text-secondary)] mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setOffset(0);
            setPosts([]);
            loadPosts(0);
          }}
          className="px-4 py-2 bg-[var(--instagram-blue)] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 빈 상태
  if (!loading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <p className="text-[var(--instagram-text-secondary)]">
          게시물이 없습니다.
        </p>
      </div>
    );
  }

  // 게시물 목록 메모이제이션
  const postCards = useMemo(() => {
    return posts.map((post) => {
      const user = users.get(post.user_id);
      return (
        <PostCard
          key={post.id}
          post={post}
          user={user}
          onLike={handleLike}
          onComment={handleComment}
        />
      );
    });
  }, [posts, users, handleLike, handleComment]);

  return (
    <div className="w-full">
      {/* 게시물 목록 */}
      {postCards}

      {/* 로딩 스켈레톤 */}
      {loading && (
        <>
          <PostCardSkeleton />
          <PostCardSkeleton />
        </>
      )}

      {/* 무한 스크롤 감지 요소 */}
      {hasMore && !loading && (
        <div ref={sentinelRef} className="h-4" aria-hidden="true" />
      )}

      {/* 더 이상 게시물이 없을 때 */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-[var(--instagram-text-secondary)] text-sm">
          모든 게시물을 불러왔습니다.
        </div>
      )}
    </div>
  );
}

