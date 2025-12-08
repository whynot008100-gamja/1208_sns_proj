/**
 * @file components/post/PostModal.tsx
 * @description 게시물 상세 모달 컴포넌트
 *
 * Instagram 스타일의 게시물 상세 모달입니다.
 * Desktop에서는 모달 형식(이미지 50% + 댓글 50%)으로, Mobile에서는 전체 페이지로 표시됩니다.
 *
 * 주요 기능:
 * 1. Desktop: 모달 형식 (이미지 50% + 댓글 50%)
 * 2. Mobile: 전체 페이지로 전환
 * 3. 닫기 버튼 및 키보드 네비게이션
 * 4. 이전/다음 게시물 네비게이션 (Desktop)
 * 5. 게시물 상세 정보 및 댓글 전체 목록 표시
 *
 * @see docs/PRD.md
 */

"use client";

import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { PostWithStats, User, CommentWithUser } from "@/lib/types";
import { useClerkSupabaseClient } from "@/utils/supabase/clerk-client";
import CommentList from "@/components/comment/CommentList";
import CommentForm from "@/components/comment/CommentForm";

interface PostModalProps {
  postId: string;
  post?: PostWithStats; // 초기 데이터 (선택적)
  user?: User; // 게시물 작성자 정보
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrevious?: () => void; // 이전 게시물로 이동
  onNext?: () => void; // 다음 게시물로 이동
  hasPrevious?: boolean; // 이전 게시물 존재 여부
  hasNext?: boolean; // 다음 게시물 존재 여부
}

function PostModal({
  postId,
  post: initialPost,
  user: initialUser,
  open,
  onOpenChange,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}: PostModalProps) {
  const { user: clerkUser } = useUser();
  const supabase = useClerkSupabaseClient();
  const [post, setPost] = useState<PostWithStats | null>(initialPost || null);
  const [user, setUser] = useState<User | undefined>(initialUser);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loading, setLoading] = useState(!initialPost);
  const [loadingComments, setLoadingComments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [supabaseUserId, setSupabaseUserId] = useState<string | undefined>();
  const commentAreaRef = useRef<HTMLDivElement>(null);

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

  // 게시물 상세 정보 로드
  const loadPost = useCallback(async () => {
    if (initialPost) {
      setPost(initialPost);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${postId}`);
      if (!response.ok) {
        throw new Error("게시물을 불러오는데 실패했습니다.");
      }

      const data = await response.json();
      setPost(data.post);
      if (data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error("Load post error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "게시물을 불러오는데 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, [postId, initialPost]);

  // 댓글 전체 목록 로드
  const loadComments = useCallback(async () => {
    if (loadingComments) return;

    setLoadingComments(true);
    try {
      const response = await fetch(`/api/comments?postId=${postId}`);
      if (!response.ok) {
        throw new Error("댓글을 불러오는데 실패했습니다.");
      }
      const data = await response.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error("Load comments error:", err);
    } finally {
      setLoadingComments(false);
    }
  }, [postId, loadingComments]);

  // 모달이 열릴 때 데이터 로드
  useEffect(() => {
    if (open) {
      loadPost();
      loadComments();
    }
  }, [open, loadPost, loadComments]);

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
            postId,
            content,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "댓글 작성에 실패했습니다.");
        }

        const newComment: CommentWithUser = await response.json();
        setComments((prev) => [...prev, newComment]);
        
        // 댓글 수 증가
        if (post) {
          setPost({
            ...post,
            comments_count: post.comments_count + 1,
          });
        }
      } catch (err) {
        console.error("Comment submit error:", err);
        throw err;
      }
    },
    [postId, post]
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

        setComments((prev) => prev.filter((c) => c.id !== commentId));
        
        // 댓글 수 감소
        if (post) {
          setPost({
            ...post,
            comments_count: Math.max(0, post.comments_count - 1),
          });
        }
      } catch (err) {
        console.error("Comment delete error:", err);
        alert(err instanceof Error ? err.message : "댓글 삭제에 실패했습니다.");
      }
    },
    [post]
  );

  // 키보드 네비게이션
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      } else if (e.key === "ArrowLeft" && hasPrevious && onPrevious) {
        e.preventDefault();
        onPrevious();
      } else if (e.key === "ArrowRight" && hasNext && onNext) {
        e.preventDefault();
        onNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, hasPrevious, hasNext, onPrevious, onNext, onOpenChange]);

  // 모달 닫기 핸들러
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // 좋아요 핸들러
  const handleLike = useCallback(() => {
    setIsLiked(!isLiked);
    // TODO: 좋아요 API 호출 (1차 제외)
  }, [isLiked]);

  // 로딩 상태
  if (loading) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] p-0 gap-0">
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-[var(--instagram-text-secondary)]">
              게시물을 불러오는 중...
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 에러 상태
  if (error || !post) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] p-0 gap-0">
          <div className="flex flex-col items-center justify-center h-[400px] p-6">
            <p className="text-[var(--instagram-text-secondary)] mb-4">
              {error || "게시물을 찾을 수 없습니다."}
            </p>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-[var(--instagram-blue)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              닫기
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Desktop 레이아웃 (모달)
  const desktopContent = (
    <div className="flex h-[90vh] max-h-[900px]">
      {/* 이미지 영역 (50%) */}
      <div className="relative flex-1 bg-black flex items-center justify-center">
        <Image
          src={post.image_url}
          alt={post.caption || "게시물 이미지"}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 450px"
          priority
        />
      </div>

      {/* 댓글 영역 (50%) */}
      <div className="flex-1 flex flex-col bg-[var(--instagram-card-background)] min-w-[300px]">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--instagram-border)]">
          <div className="flex items-center gap-3">
            <Link href={user ? `/profile/${user.id}` : "#"}>
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {user?.name ? (
                  <span className="text-xs font-semibold text-gray-600">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <div className="w-full h-full bg-gray-300" />
                )}
              </div>
            </Link>
            <Link
              href={user ? `/profile/${user.id}` : "#"}
              className="font-semibold text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity"
            >
              {user?.name || "Unknown"}
            </Link>
          </div>
          <button
            className="text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity"
            aria-label="더보기"
          >
            <MoreHorizontal className="w-6 h-6" />
          </button>
        </div>

        {/* 댓글 목록 (스크롤 가능) */}
        <div
          ref={commentAreaRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        >
          {/* 캡션 */}
          {post.caption && (
            <div className="text-sm text-[var(--instagram-text-primary)]">
              <Link
                href={user ? `/profile/${user.id}` : "#"}
                className="font-semibold hover:opacity-70 transition-opacity mr-2"
              >
                {user?.name || "Unknown"}
              </Link>
              <span className="whitespace-pre-wrap">{post.caption}</span>
            </div>
          )}

          {/* 댓글 목록 */}
          {loadingComments ? (
            <div className="text-sm text-[var(--instagram-text-secondary)]">
              댓글을 불러오는 중...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-sm text-[var(--instagram-text-secondary)] text-center py-8">
              아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
            </div>
          ) : (
            <CommentList
              comments={comments}
              postId={postId}
              currentUserId={supabaseUserId}
              showAll={true}
              onDelete={handleCommentDelete}
            />
          )}
        </div>

        {/* 액션 버튼 및 좋아요 수 */}
        <div className="border-t border-[var(--instagram-border)]">
          <div className="px-4 py-3 space-y-2">
            {/* 액션 버튼 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className={cn(
                    "transition-transform active:scale-125",
                    isLiked
                      ? "text-[var(--instagram-like)]"
                      : "text-[var(--instagram-text-primary)]"
                  )}
                  onClick={handleLike}
                  aria-label={isLiked ? "좋아요 취소" : "좋아요"}
                >
                  <Heart
                    className={cn("w-6 h-6", isLiked && "fill-current")}
                    strokeWidth={isLiked ? 0 : 2}
                  />
                </button>
                <button
                  className="text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity"
                  aria-label="댓글"
                >
                  <MessageCircle className="w-6 h-6" />
                </button>
                <button
                  className="text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity"
                  aria-label="공유"
                  disabled
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
              <button
                className="text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity"
                aria-label="저장"
                disabled
              >
                <Bookmark className="w-6 h-6" />
              </button>
            </div>

            {/* 좋아요 수 */}
            {post.likes_count > 0 && (
              <div className="font-semibold text-sm text-[var(--instagram-text-primary)]">
                좋아요 {post.likes_count.toLocaleString()}개
              </div>
            )}
          </div>

          {/* 댓글 작성 폼 */}
          <CommentForm
            postId={postId}
            onSubmit={handleCommentSubmit}
            placeholder="댓글 달기..."
            autoFocus={false}
          />
        </div>
      </div>
    </div>
  );

  // Mobile 레이아웃 (전체 페이지)
  const mobileContent = (
    <div className="flex flex-col h-screen bg-[var(--instagram-card-background)]">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--instagram-border)]">
        <button
          onClick={handleClose}
          className="text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity"
          aria-label="닫기"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="font-semibold text-[var(--instagram-text-primary)]">
          게시물
        </h2>
        <button
          onClick={handleClose}
          className="text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity"
          aria-label="닫기"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* 스크롤 가능한 컨텐츠 */}
      <div className="flex-1 overflow-y-auto">
        {/* 게시물 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--instagram-border)]">
          <div className="flex items-center gap-3">
            <Link href={user ? `/profile/${user.id}` : "#"}>
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {user?.name ? (
                  <span className="text-xs font-semibold text-gray-600">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <div className="w-full h-full bg-gray-300" />
                )}
              </div>
            </Link>
            <Link
              href={user ? `/profile/${user.id}` : "#"}
              className="font-semibold text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity"
            >
              {user?.name || "Unknown"}
            </Link>
            <span className="text-xs text-[var(--instagram-text-secondary)]">
              {formatRelativeTime(post.created_at)}
            </span>
          </div>
          <button
            className="text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity"
            aria-label="더보기"
          >
            <MoreHorizontal className="w-6 h-6" />
          </button>
        </div>

        {/* 이미지 */}
        <div className="relative w-full aspect-square bg-black">
          <Image
            src={post.image_url}
            alt={post.caption || "게시물 이미지"}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>

        {/* 액션 버튼 및 좋아요 수 */}
        <div className="px-4 py-3 space-y-2 border-b border-[var(--instagram-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                className={cn(
                  "transition-transform active:scale-125",
                  isLiked
                    ? "text-[var(--instagram-like)]"
                    : "text-[var(--instagram-text-primary)]"
                )}
                onClick={handleLike}
                aria-label={isLiked ? "좋아요 취소" : "좋아요"}
              >
                <Heart
                  className={cn("w-6 h-6", isLiked && "fill-current")}
                  strokeWidth={isLiked ? 0 : 2}
                />
              </button>
              <button
                className="text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity"
                aria-label="댓글"
              >
                <MessageCircle className="w-6 h-6" />
              </button>
              <button
                className="text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity"
                aria-label="공유"
                disabled
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
            <button
              className="text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity"
              aria-label="저장"
              disabled
            >
              <Bookmark className="w-6 h-6" />
            </button>
          </div>

          {post.likes_count > 0 && (
            <div className="font-semibold text-sm text-[var(--instagram-text-primary)]">
              좋아요 {post.likes_count.toLocaleString()}개
            </div>
          )}

          {/* 캡션 */}
          {post.caption && (
            <div className="text-sm text-[var(--instagram-text-primary)]">
              <Link
                href={user ? `/profile/${user.id}` : "#"}
                className="font-semibold hover:opacity-70 transition-opacity mr-2"
              >
                {user?.name || "Unknown"}
              </Link>
              <span className="whitespace-pre-wrap">{post.caption}</span>
            </div>
          )}
        </div>

        {/* 댓글 목록 */}
        <div className="px-4 py-4 space-y-2">
          {loadingComments ? (
            <div className="text-sm text-[var(--instagram-text-secondary)]">
              댓글을 불러오는 중...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-sm text-[var(--instagram-text-secondary)] text-center py-8">
              아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
            </div>
          ) : (
            <CommentList
              comments={comments}
              postId={postId}
              currentUserId={supabaseUserId}
              showAll={true}
              onDelete={handleCommentDelete}
            />
          )}
        </div>
      </div>

      {/* 댓글 작성 폼 */}
      <div className="border-t border-[var(--instagram-border)]">
        <CommentForm
          postId={postId}
          onSubmit={handleCommentSubmit}
          placeholder="댓글 달기..."
          autoFocus={false}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: Dialog 모달 */}
      <Dialog open={open && typeof window !== "undefined" && window.innerWidth >= 768} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] p-0 gap-0 overflow-hidden">
          {/* 닫기 버튼 (Desktop) */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-50 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 이전/다음 네비게이션 버튼 (Desktop) */}
          {hasPrevious && onPrevious && (
            <button
              onClick={onPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              aria-label="이전 게시물"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {hasNext && onNext && (
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              aria-label="다음 게시물"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {desktopContent}
        </DialogContent>
      </Dialog>

      {/* Mobile: 전체 페이지 */}
      {open && typeof window !== "undefined" && window.innerWidth < 768 && (
        <div className="fixed inset-0 z-50 bg-[var(--instagram-card-background)]">
          {mobileContent}
        </div>
      )}
    </>
  );
}

export default memo(PostModal);

