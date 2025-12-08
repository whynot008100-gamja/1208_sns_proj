/**
 * @file components/post/PostCard.tsx
 * @description Instagram 스타일 게시물 카드 컴포넌트
 *
 * 게시물의 모든 정보를 표시하는 카드 컴포넌트입니다.
 * 헤더, 이미지, 액션 버튼, 좋아요 수, 캡션, 댓글 미리보기를 포함합니다.
 *
 * @see docs/PRD.md
 */

"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { PostWithStats, User, CommentWithUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useClerkSupabaseClient } from "@/utils/supabase/clerk-client";
import CommentList from "@/components/comment/CommentList";
import CommentForm from "@/components/comment/CommentForm";
import PostMenu from "./PostMenu";
import DeletePostDialog from "./DeletePostDialog";

interface PostCardProps {
  post: PostWithStats;
  user?: User;
  currentUserId?: string;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onImageClick?: (postId: string) => void; // 이미지 클릭 시 모달 열기
  onDelete?: (postId: string) => void; // 게시물 삭제 시 콜백
}

function PostCard({
  post,
  user,
  currentUserId,
  onLike,
  onComment,
  onImageClick,
  onDelete,
}: PostCardProps) {
  const { user: clerkUser } = useUser();
  const supabase = useClerkSupabaseClient();
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [isLiked, setIsLiked] = useState(false); // 1차 제외 - UI만
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [supabaseUserId, setSupabaseUserId] = useState<string | undefined>(currentUserId);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);

  // 본인 게시물 여부 확인
  const isOwner = supabaseUserId === post.user_id;

  // 캡션 2줄 초과 여부 확인 (간단한 구현)
  const captionLines = post.caption?.split("\n") || [];
  const shouldTruncate = captionLines.length > 2 || (post.caption?.length || 0) > 100;
  const displayCaption = showFullCaption
    ? post.caption
    : shouldTruncate
    ? post.caption?.substring(0, 100) + "..."
    : post.caption;

  // Clerk user ID를 Supabase user_id로 변환
  useEffect(() => {
    if (supabaseUserId || !clerkUser?.id) return;

    const fetchSupabaseUserId = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_id", clerkUser.id)
          .single();

        if (!error && data) {
          setSupabaseUserId(data.id);
        }
      } catch (err) {
        console.error("Failed to get Supabase user ID:", err);
      }
    };

    fetchSupabaseUserId();
  }, [clerkUser?.id, supabaseUserId, supabase]);

  // 댓글 조회 함수
  const loadComments = useCallback(async () => {
    if (loadingComments) return;

    setLoadingComments(true);
    try {
      const response = await fetch(`/api/comments?postId=${post.id}&limit=2`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "댓글을 불러오는데 실패했습니다.");
      }
      const data = await response.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error("Load comments error:", err);
      // 댓글 로드 실패는 조용히 처리 (게시물은 표시)
    } finally {
      setLoadingComments(false);
    }
  }, [post.id, loadingComments]);

  // 댓글이 있고 아직 로드하지 않았을 때만 로드 (lazy loading)
  useEffect(() => {
    if (post.comments_count > 0 && comments.length === 0 && !loadingComments) {
      loadComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.comments_count]);

  // 댓글 작성 핸들러
  const handleCommentSubmit = useCallback(
    async (content: string) => {
      try {
        const response = await fetch("/api/comments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            postId: post.id,
            content,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || "댓글 작성에 실패했습니다.";
          throw new Error(errorMessage);
        }

        const newComment: CommentWithUser = await response.json();
        // 댓글 목록에 추가 (최신 댓글이므로 맨 뒤에 추가)
        setComments((prev) => {
          const updated = [...prev, newComment];
          // 최신 2개만 유지
          return updated.slice(-2);
        });
      } catch (err) {
        console.error("Comment submit error:", err);
        if (err instanceof TypeError && err.message === "Failed to fetch") {
          throw new Error("인터넷 연결을 확인해주세요.");
        }
        throw err;
      }
    },
    [post.id, loadComments]
  );

  // 댓글 삭제 핸들러
  const handleCommentDelete = useCallback(
    async (commentId: string) => {
      try {
        const response = await fetch(`/api/comments?commentId=${commentId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "댓글 삭제에 실패했습니다.");
        }

        // 댓글 목록에서 제거
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        // 댓글이 부족하면 다시 로드
        if (comments.length <= 2) {
          loadComments();
        }
      } catch (err) {
        console.error("Comment delete error:", err);
        let errorMessage = "댓글 삭제에 실패했습니다.";
        if (err instanceof TypeError && err.message === "Failed to fetch") {
          errorMessage = "인터넷 연결을 확인해주세요.";
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        alert(errorMessage);
      }
    },
    [loadComments]
  );

  // 댓글 미리보기 표시 여부
  const showCommentsPreview = post.comments_count > 2;

  return (
    <article className="bg-[var(--instagram-card-background)] border-b border-[var(--instagram-border)] mb-4">
      {/* 헤더 (60px 높이) */}
      <header className="flex items-center justify-between px-4 py-3 h-[60px]">
        <div className="flex items-center gap-3">
          {/* 프로필 이미지: 32px 원형 */}
          <Link 
            href={user ? `/profile/${user.id}` : "#"}
            aria-label={`${user?.name || "사용자"} 프로필 보기`}
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {user?.name ? (
                <span className="text-xs font-semibold text-gray-600" aria-hidden="true">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <div className="w-full h-full bg-gray-300" aria-hidden="true" />
              )}
            </div>
          </Link>

          {/* 사용자명: Bold */}
          <Link
            href={user ? `/profile/${user.id}` : "#"}
            className="font-semibold text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity"
            aria-label={`${user?.name || "사용자"} 프로필 보기`}
          >
            {user?.name || "Unknown"}
          </Link>

          {/* 시간: 작고 회색 */}
          <span className="text-xs text-[var(--instagram-text-secondary)]">
            {formatRelativeTime(post.created_at)}
          </span>
        </div>

        {/* ⋯ 메뉴: 우측 정렬 */}
        <PostMenu
          isOwner={isOwner}
          onDelete={() => setIsDeleteDialogOpen(true)}
        />
      </header>

      {/* 이미지 영역 (1:1 정사각형) */}
      <div
        className="relative w-full aspect-square bg-gray-100 cursor-pointer"
        onClick={() => onImageClick?.(post.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onImageClick?.(post.id);
          }
        }}
        aria-label="게시물 상세 보기"
      >
        <Image
          src={post.image_url}
          alt={post.caption || "게시물 이미지"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 630px"
          priority={false}
          loading="lazy"
          onDoubleClick={(e) => {
            e.stopPropagation(); // 모달 열기 방지
            // 더블탭 좋아요
            if (!isLiked) {
              setIsLiked(true);
              onLike?.(post.id);
            }
            // 큰 하트 애니메이션 표시
            setShowDoubleTapHeart(true);
            setTimeout(() => setShowDoubleTapHeart(false), 1000);
          }}
        />
        {/* 더블탭 큰 하트 애니메이션 */}
        {showDoubleTapHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <Heart
              className={cn(
                "w-24 h-24 text-[var(--instagram-like)] fill-current",
                "animate-in fade-in duration-300",
                "animate-out fade-out duration-700"
              )}
              strokeWidth={0}
            />
          </div>
        )}
      </div>

      {/* 액션 버튼 (48px 높이) */}
      <div className="flex items-center justify-between px-4 py-3 h-[48px]">
        <div className="flex items-center gap-4">
          {/* 좋아요 버튼 */}
          <button
            className={cn(
              "transition-transform duration-150",
              isAnimating && "scale-[1.3]",
              isLiked
                ? "text-[var(--instagram-like)]"
                : "text-[var(--instagram-text-primary)]"
            )}
            onClick={() => {
              setIsAnimating(true);
              setIsLiked(!isLiked);
              onLike?.(post.id);
              setTimeout(() => setIsAnimating(false), 150);
            }}
            aria-label={isLiked ? "좋아요 취소" : "좋아요"}
          >
            <Heart
              className={cn("w-6 h-6 transition-all duration-150", isLiked && "fill-current")}
              strokeWidth={isLiked ? 0 : 2}
            />
          </button>

          {/* 댓글 버튼 */}
          <button
            className="text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity"
            onClick={() => {
              onImageClick?.(post.id); // 댓글 버튼 클릭 시 모달 열기
              onComment?.(post.id);
            }}
            aria-label="댓글"
          >
            <MessageCircle className="w-6 h-6" />
          </button>

          {/* 공유 버튼 (UI만, 1차 제외) */}
          <button
            className="text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity"
            aria-label="공유"
            disabled
          >
            <Send className="w-6 h-6" />
          </button>
        </div>

        {/* 북마크 버튼 (UI만, 1차 제외) */}
        <button
          className="text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity"
          aria-label="저장"
          disabled
        >
          <Bookmark className="w-6 h-6" />
        </button>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="px-4 pb-4 space-y-2">
        {/* 좋아요 수: Bold */}
        {post.likes_count > 0 && (
          <div className="font-semibold text-[var(--instagram-text-primary)]">
            좋아요 {post.likes_count.toLocaleString()}개
          </div>
        )}

        {/* 캡션: 사용자명 Bold + 내용 */}
        {post.caption && (
          <div className="text-[var(--instagram-text-primary)]">
            <Link
              href={user ? `/profile/${user.id}` : "#"}
              className="font-semibold hover:opacity-70 transition-opacity mr-2"
              aria-label={`${user?.name || "사용자"} 프로필 보기`}
            >
              {user?.name || "Unknown"}
            </Link>
            <span className="whitespace-pre-wrap">{displayCaption}</span>
            {shouldTruncate && !showFullCaption && (
              <button
                className="text-[var(--instagram-text-secondary)] hover:text-[var(--instagram-text-primary)] ml-1"
                onClick={() => setShowFullCaption(true)}
                aria-label="캡션 전체 보기"
              >
                ... 더 보기
              </button>
            )}
          </div>
        )}

        {/* 댓글 목록 */}
        {comments.length > 0 && (
          <div className="space-y-1">
            <CommentList
              comments={comments}
              postId={post.id}
              currentUserId={supabaseUserId}
              limit={2}
              showAll={false}
              onDelete={handleCommentDelete}
            />
          </div>
        )}

        {/* 댓글 미리보기 */}
        {showCommentsPreview && (
          <button
            className="text-[var(--instagram-text-secondary)] text-sm hover:text-[var(--instagram-text-primary)] transition-colors"
            onClick={() => {
              // TODO: 댓글 상세 모달 열기 (1차 제외)
              onComment?.(post.id);
            }}
            aria-label={`댓글 ${post.comments_count}개 모두 보기`}
          >
            댓글 {post.comments_count}개 모두 보기
          </button>
        )}
      </div>

      {/* 댓글 작성 폼 */}
      <CommentForm
        postId={post.id}
        onSubmit={handleCommentSubmit}
        placeholder="댓글 달기..."
        autoFocus={false}
      />

      {/* 삭제 확인 다이얼로그 */}
      <DeletePostDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        postId={post.id}
        onDelete={() => {
          onDelete?.(post.id);
        }}
      />
    </article>
  );
}

// React.memo로 최적화 (props가 변경되지 않으면 리렌더링 방지)
export default memo(PostCard);

