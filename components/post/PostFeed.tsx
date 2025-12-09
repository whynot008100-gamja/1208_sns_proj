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
import PostModal from "./PostModal";
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
  
  // 모달 상태 관리
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "게시물을 불러오는데 실패했습니다.");
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
        let errorMessage = "게시물을 불러오는데 실패했습니다.";
        
        if (err instanceof TypeError && err.message === "Failed to fetch") {
          errorMessage = "인터넷 연결을 확인해주세요.";
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
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

  // 게시물 업데이트 핸들러 (좋아요, 댓글, 저장 등 모든 변경사항 반영)
  const handlePostUpdate = useCallback((postId: string, updates: Partial<PostWithStats>) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return { ...p, ...updates };
        }
        return p;
      })
    );
  }, []);

  // 좋아요 핸들러 (좋아요 수 업데이트)
  const handleLike = useCallback((postId: string, isLiked: boolean) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          // 좋아요 상태에 따라 증가/감소
          return { 
            ...p, 
            likes_count: isLiked 
              ? p.likes_count + 1 
              : Math.max(0, p.likes_count - 1)
          };
        }
        return p;
      })
    );
  }, []);

  // 댓글 핸들러
  const handleComment = useCallback((postId: string) => {
    // 댓글 버튼 클릭 시 모달 열기
    setSelectedPostId(postId);
    setIsModalOpen(true);
  }, []);

  // 이미지 클릭 핸들러 (모달 열기)
  const handleImageClick = useCallback((postId: string) => {
    setSelectedPostId(postId);
    setIsModalOpen(true);
  }, []);

  // 모달 닫기
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    // 모달이 닫힌 후 약간의 지연 후 selectedPostId 초기화 (애니메이션 완료 대기)
    setTimeout(() => {
      setSelectedPostId(null);
    }, 200);
  }, []);

  // 이전 게시물로 이동
  const handlePrevious = useCallback(() => {
    if (!selectedPostId) return;
    const currentIndex = posts.findIndex((p) => p.id === selectedPostId);
    if (currentIndex > 0) {
      setSelectedPostId(posts[currentIndex - 1].id);
    }
  }, [selectedPostId, posts]);

  // 다음 게시물로 이동
  const handleNext = useCallback(() => {
    if (!selectedPostId) return;
    const currentIndex = posts.findIndex((p) => p.id === selectedPostId);
    if (currentIndex < posts.length - 1) {
      setSelectedPostId(posts[currentIndex + 1].id);
    }
  }, [selectedPostId, posts]);

  // 현재 게시물의 이전/다음 게시물 존재 여부 계산
  const navigationInfo = useMemo(() => {
    if (!selectedPostId) {
      return { hasPrevious: false, hasNext: false };
    }
    const currentIndex = posts.findIndex((p) => p.id === selectedPostId);
    return {
      hasPrevious: currentIndex > 0,
      hasNext: currentIndex < posts.length - 1,
    };
  }, [selectedPostId, posts]);

  // 선택된 게시물 정보
  const selectedPost = useMemo(() => {
    if (!selectedPostId) return undefined;
    return posts.find((p) => p.id === selectedPostId);
  }, [selectedPostId, posts]);

  // 선택된 게시물의 사용자 정보
  const selectedPostUser = useMemo(() => {
    if (!selectedPost) return undefined;
    return users.get(selectedPost.user_id);
  }, [selectedPost, users]);

  // 게시물 삭제 핸들러
  const handlePostDelete = useCallback(
    (postId: string) => {
      // 피드에서 게시물 제거
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      // 모달이 열려있으면 닫기
      if (selectedPostId === postId) {
        setIsModalOpen(false);
        setSelectedPostId(null);
      }
    },
    [selectedPostId]
  );

  // 게시물 목록 메모이제이션 (조건부 return 전에 호출)
  const postCards = useMemo(() => {
    return posts.map((post, index) => {
      const user = users.get(post.user_id);
      return (
        <PostCard
          key={post.id}
          post={post}
          user={user}
          onLike={handleLike}
          onComment={handleComment}
          onImageClick={handleImageClick}
          onDelete={handlePostDelete}
          onPostUpdate={handlePostUpdate}
          isPriority={index === 0}
        />
      );
    });
  }, [posts, users, handleLike, handleComment, handleImageClick, handlePostDelete, handlePostUpdate]);

  return (
    <div className="w-full">
      {/* 에러 상태 */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-[var(--instagram-text-secondary)] mb-4">{error}</p>
          <button
            onClick={() => loadPosts(0, true)}
            className="px-4 py-2 bg-[var(--instagram-blue)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 게시물이 없을 때 */}
      {!loading && !error && posts.length === 0 && !hasMore && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 mb-4 rounded-full border-2 border-[var(--instagram-text-secondary)] flex items-center justify-center">
            <svg className="w-12 h-12 text-[var(--instagram-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-[var(--instagram-text-primary)] mb-2">
            게시물이 없습니다
          </h3>
          <p className="text-[var(--instagram-text-secondary)] text-sm">
            첫 번째 게시물을 공유해보세요!
          </p>
        </div>
      )}

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
      {hasMore && !loading && posts.length > 0 && (
        <div ref={sentinelRef} className="h-4" aria-hidden="true" />
      )}

      {/* 더 이상 게시물이 없을 때 */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-[var(--instagram-text-secondary)] text-sm">
          모든 게시물을 불러왔습니다.
        </div>
      )}

      {/* 게시물 상세 모달 */}
      {selectedPostId && (
        <PostModal
          postId={selectedPostId}
          post={selectedPost}
          user={selectedPostUser}
          open={isModalOpen}
          onOpenChange={handleModalClose}
          onPrevious={navigationInfo.hasPrevious ? handlePrevious : undefined}
          onNext={navigationInfo.hasNext ? handleNext : undefined}
          hasPrevious={navigationInfo.hasPrevious}
          hasNext={navigationInfo.hasNext}
          onPostDelete={handlePostDelete}
          onPostUpdate={handlePostUpdate}
        />
      )}
    </div>
  );
}

