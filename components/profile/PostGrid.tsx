/**
 * @file components/profile/PostGrid.tsx
 * @description 게시물 그리드 컴포넌트
 *
 * Instagram 스타일의 3열 그리드 레이아웃으로 게시물을 표시합니다.
 * - 3열 그리드 (반응형)
 * - 1:1 정사각형 썸네일
 * - Hover 시 좋아요/댓글 수 오버레이 표시
 * - 클릭 시 게시물 상세 모달 열기
 *
 * @see docs/PRD.md
 */

"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";
import type { PostWithStats } from "@/lib/types";
import PostModal from "@/components/post/PostModal";
import type { User } from "@/lib/types";

interface PostGridProps {
  userId: string; // Supabase user ID
  onPostClick?: (postId: string) => void;
}

interface PostsResponse {
  posts: PostWithStats[];
  users: User[];
  hasMore: boolean;
}

function PostGrid({ userId, onPostClick }: PostGridProps) {
  const [posts, setPosts] = useState<PostWithStats[]>([]);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 모달 상태 관리
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostWithStats | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | undefined>();

  // 게시물 로드 함수
  const loadPosts = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams({
        limit: "100", // 프로필 페이지는 게시물 수가 제한적이므로 충분히 큰 값
        offset: "0",
        userId: userId,
      });

      const response = await fetch(`/api/posts?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "게시물을 불러오는데 실패했습니다.");
      }

      const data: PostsResponse = await response.json();

      setPosts(data.posts || []);

      // 사용자 정보 맵 생성
      if (data.users) {
        const userMap = new Map(
          data.users.map((user) => [user.id, user])
        );
        setUsers(userMap);
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
    }
  }, [userId]);

  // 초기 로드
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // 게시물 클릭 핸들러
  const handlePostClick = useCallback(
    (post: PostWithStats) => {
      setSelectedPost(post);
      setSelectedUser(users.get(post.user_id));
      setSelectedPostId(post.id);
      setIsModalOpen(true);
      onPostClick?.(post.id);
    },
    [users, onPostClick]
  );

  // 모달 닫기 핸들러
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPostId(null);
    setSelectedPost(null);
    setSelectedUser(undefined);
  }, []);

  // 게시물 그리드 메모이제이션 (조건부 return 전에 호출)
  const postGridItems = useMemo(() => {
    return posts.map((post) => {
      return (
                <div
                  key={post.id}
                  className="relative aspect-square bg-gray-100 cursor-pointer group"
                  onClick={() => handlePostClick(post)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handlePostClick(post);
                    }
                  }}
                  aria-label={`게시물 보기: ${post.caption || "이미지"}`}
                >
                  {/* 이미지 */}
                  <Image
                    src={post.image_url}
                    alt={post.caption || "게시물 이미지"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 33vw, 33vw"
                    loading="lazy"
                  />

                  {/* Hover 오버레이 (Desktop/Tablet만) */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-6 text-white transition-opacity opacity-0 md:group-hover:opacity-100">
                    <div className="flex items-center gap-1">
                      <Heart className="w-6 h-6 fill-current" />
                      <span className="font-semibold">
                        {post.likes_count.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-6 h-6 fill-current" />
                      <span className="font-semibold">
                        {post.comments_count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
    });
  }, [posts, users, handlePostClick]);

  // 게시물이 없는 경우
  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-[var(--instagram-text-secondary)] text-lg">
          게시물이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 3열 그리드 */}
      <div className="grid grid-cols-3 gap-1 md:gap-4">
        {postGridItems}
      </div>

      {/* 게시물 상세 모달 */}
      {selectedPost && (
        <PostModal
          postId={selectedPost.id}
          post={selectedPost}
          user={selectedUser}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      )}
    </>
  );
}

export default memo(PostGrid);

