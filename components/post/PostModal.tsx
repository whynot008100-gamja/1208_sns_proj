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
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
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
import PostMenu from "./PostMenu";
import DeletePostDialog from "./DeletePostDialog";
import EditPostModal from "./EditPostModal";

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
  onPostDelete?: (postId: string) => void; // 게시물 삭제 시 콜백
  onPostUpdate?: (postId: string, updates: Partial<PostWithStats>) => void; // 게시물 업데이트 콜백
  onSaveRemove?: (postId: string) => void; // 저장 취소 시 콜백 (저장된 게시물 페이지에서 사용)
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
  onPostDelete,
  onPostUpdate,
  onSaveRemove,
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
  const [isSaved, setIsSaved] = useState(false);
  const [supabaseUserId, setSupabaseUserId] = useState<string | undefined>();
  const commentAreaRef = useRef<HTMLDivElement>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const isLoadingCommentsRef = useRef(false);

  // 본인 게시물 여부 확인
  const isOwner = supabaseUserId === post?.user_id;

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
    // initialPost가 있으면 우선 사용 (최신 데이터)
    if (initialPost) {
      setPost(initialPost);
      setLoading(false);
      // initialPost가 있더라도 사용자 정보는 별도로 로드
      if (!initialUser) {
        try {
          const response = await fetch(`/api/posts/${postId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              setUser(data.user);
            }
          }
        } catch (err) {
          console.error("Failed to load user info:", err);
        }
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${postId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "게시물을 불러오는데 실패했습니다.");
      }

      const data = await response.json();
      setPost(data.post);
      if (data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error("Load post error:", err);
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
  }, [postId, initialPost, initialUser]);

  // 댓글 전체 목록 로드
  const loadComments = useCallback(async () => {
    if (!postId || isLoadingCommentsRef.current) return;

    isLoadingCommentsRef.current = true;
    setLoadingComments(true);
    
    // 타임아웃 설정 (10초 후 강제 종료)
    const timeoutId = setTimeout(() => {
      console.warn("댓글 로딩 타임아웃");
      isLoadingCommentsRef.current = false;
      setLoadingComments(false);
      setComments([]);
    }, 10000);

    try {
      const response = await fetch(`/api/comments?postId=${postId}`);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "댓글을 불러오는데 실패했습니다.");
      }
      const data = await response.json();
      setComments(data.comments || []);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Load comments error:", err);
      // 에러 발생 시 빈 배열로 설정
      setComments([]);
    } finally {
      isLoadingCommentsRef.current = false;
      setLoadingComments(false);
    }
  }, [postId]);

  // 모달이 열릴 때 데이터 로드
  useEffect(() => {
    if (open && postId) {
      // initialPost가 변경되면 최신 데이터로 업데이트
      if (initialPost) {
        setPost(initialPost);
      }
      if (initialUser) {
        setUser(initialUser);
      }
      loadPost();
      loadComments();
    } else if (!open) {
      // 모달이 닫힐 때 상태 초기화
      setComments([]);
      setLoadingComments(false);
      isLoadingCommentsRef.current = false;
    }
  }, [open, postId, loadPost, loadComments, initialPost, initialUser]);

  // 좋아요 상태 확인 (supabaseUserId와 post가 있을 때)
  useEffect(() => {
    if (!supabaseUserId || !post) return;

    const checkLikeStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("likes")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", supabaseUserId)
          .single();

        if (!error && data) {
          setIsLiked(true);
        } else {
          setIsLiked(false);
        }
      } catch (err) {
        setIsLiked(false);
      }
    };

    checkLikeStatus();
  }, [supabaseUserId, post, supabase]);

  // 저장 상태 확인 (supabaseUserId와 post가 있을 때)
  useEffect(() => {
    if (!supabaseUserId || !post?.id) return;

    const checkSaveStatus = async () => {
      try {
        const response = await fetch(`/api/saves?postId=${post.id}`);
        if (response.ok) {
          const data = await response.json();
          setIsSaved(data.isSaved || false);
        } else {
          // 응답이 실패해도 에러로 처리하지 않음 (저장되지 않은 것으로 간주)
          setIsSaved(false);
        }
      } catch (err) {
        console.error("Failed to check save status:", err);
        // 네트워크 에러 등은 저장되지 않은 것으로 간주
        setIsSaved(false);
      }
    };

    checkSaveStatus();
  }, [supabaseUserId, post?.id]);

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
          const updatedPost = {
            ...post,
            comments_count: post.comments_count + 1,
          };
          setPost(updatedPost);
          onPostUpdate?.(postId, { comments_count: updatedPost.comments_count });
        }
      } catch (err) {
        console.error("Comment submit error:", err);
        if (err instanceof TypeError && err.message === "Failed to fetch") {
          throw new Error("인터넷 연결을 확인해주세요.");
        }
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
          const updatedPost = {
            ...post,
            comments_count: Math.max(0, post.comments_count - 1),
          };
          setPost(updatedPost);
          onPostUpdate?.(postId, { comments_count: updatedPost.comments_count });
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
  const handleLike = useCallback(async () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState); // 낙관적 업데이트

    try {
      if (newLikedState) {
        // 좋아요 추가
        const response = await fetch("/api/likes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ postId }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status !== 409) {
            throw new Error(errorData.error || "좋아요 추가에 실패했습니다.");
          }
        }

        // 좋아요 수 증가
        if (post) {
          const updatedPost = {
            ...post,
            likes_count: post.likes_count + 1,
          };
          setPost(updatedPost);
          onPostUpdate?.(postId, { likes_count: updatedPost.likes_count });
        }
      } else {
        // 좋아요 제거
        const response = await fetch(`/api/likes?postId=${postId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "좋아요 제거에 실패했습니다.");
        }

        // 좋아요 수 감소
        if (post) {
          const updatedPost = {
            ...post,
            likes_count: Math.max(0, post.likes_count - 1),
          };
          setPost(updatedPost);
          onPostUpdate?.(postId, { likes_count: updatedPost.likes_count });
        }
      }
    } catch (err) {
      // 에러 발생 시 상태 롤백
      setIsLiked(!newLikedState);
      console.error("Like error:", err);
    }
  }, [isLiked, postId, post]);

  // 저장 핸들러
  const handleSave = useCallback(async () => {
    const newSavedState = !isSaved;
    setIsSaved(newSavedState); // 낙관적 업데이트

    try {
      if (newSavedState) {
        // 저장 추가
        const response = await fetch("/api/saves", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ postId }),
        });

        if (!response.ok) {
          // 응답 본문을 텍스트로 먼저 읽기
          const responseText = await response.text();
          let errorData: any = {};
          
          try {
            errorData = JSON.parse(responseText);
          } catch (e) {
            // JSON 파싱 실패 시 원본 텍스트 사용
            console.error("Failed to parse error response as JSON:", responseText);
            errorData = { error: responseText || "알 수 없는 오류가 발생했습니다." };
          }
          
          if (response.status !== 409) {
            console.error("Save API error:", {
              status: response.status,
              statusText: response.statusText,
              error: errorData,
              rawResponse: responseText,
            });
            throw new Error(errorData.error || "저장에 실패했습니다.");
          }
        }
      } else {
        // 저장 제거
        const response = await fetch(`/api/saves?postId=${postId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          // 응답 본문을 텍스트로 먼저 읽기
          const responseText = await response.text();
          let errorData: any = {};
          
          try {
            errorData = JSON.parse(responseText);
          } catch (e) {
            // JSON 파싱 실패 시 원본 텍스트 사용
            console.error("Failed to parse error response as JSON:", responseText);
            errorData = { error: responseText || "알 수 없는 오류가 발생했습니다." };
          }
          
          console.error("Save delete API error:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            rawResponse: responseText,
          });
          throw new Error(errorData.error || "저장 취소에 실패했습니다.");
        }
        
        // 저장 취소 성공 시 콜백 호출 (저장된 게시물 페이지에서 목록에서 제거)
        onSaveRemove?.(postId);
      }
    } catch (err) {
      // 에러 발생 시 상태 롤백
      setIsSaved(!newSavedState);
      console.error("Save error:", err);
      let errorMessage = "저장 처리에 실패했습니다.";
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        errorMessage = "인터넷 연결을 확인해주세요.";
      } else if (err instanceof Error) {
        errorMessage = err.message;
        // 테이블이 존재하지 않는 경우 특별한 메시지
        if (err.message.includes("마이그레이션") || err.message.includes("TABLE_NOT_FOUND")) {
          errorMessage = "저장 기능을 사용하려면 데이터베이스 마이그레이션을 먼저 적용해주세요.";
        }
      }
      alert(errorMessage);
    }
  }, [isSaved, postId]);

  // 공유 핸들러
  const handleShare = useCallback(async () => {
    try {
      // 게시물 URL 생성
      const postUrl = `${window.location.origin}/post/${postId}`;
      
      // 클립보드에 복사
      await navigator.clipboard.writeText(postUrl);
      
      // 성공 피드백
      alert("링크가 클립보드에 복사되었습니다!");
    } catch (err) {
      console.error("Failed to copy URL:", err);
      alert("링크 복사에 실패했습니다.");
    }
  }, [postId]);

  // 로딩 상태
  if (loading) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] p-0 gap-0">
          <DialogTitle className="sr-only">게시물 로딩 중</DialogTitle>
          <DialogDescription className="sr-only">게시물 데이터를 불러오고 있습니다.</DialogDescription>
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
          <DialogTitle className="sr-only">게시물 오류</DialogTitle>
          <DialogDescription className="sr-only">게시물을 불러오는 중 오류가 발생했습니다.</DialogDescription>
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
            <Link
              href={user ? `/profile/${user.id}` : "#"}
              className="font-semibold text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity"
              aria-label={`${user?.name || "사용자"} 프로필 보기`}
            >
              {user?.name || "Unknown"}
            </Link>
          </div>
          <PostMenu
            isOwner={isOwner || false}
            onEdit={() => setIsEditModalOpen(true)}
            onDelete={() => setIsDeleteDialogOpen(true)}
          />
        </div>

        {/* 타이틀 (헤더 아래) */}
        {post.title && (
          <div className="px-4 py-3 border-b border-[var(--instagram-border)]">
            <h2 className="text-lg font-bold text-[var(--instagram-text-primary)] leading-tight">
              {post.title}
            </h2>
          </div>
        )}

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
                aria-label={`${user?.name || "사용자"} 프로필 보기`}
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
                  disabled
                >
                  <MessageCircle className="w-6 h-6" />
                </button>
                <button
                  className="text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity"
                  onClick={handleShare}
                  aria-label="공유"
                  type="button"
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
              <button
                className={cn(
                  "transition-opacity",
                  isSaved
                    ? "text-[var(--instagram-text-primary)]"
                    : "text-[var(--instagram-text-primary)] hover:opacity-70"
                )}
                onClick={handleSave}
                aria-label={isSaved ? "저장 취소" : "저장"}
                type="button"
              >
                <Bookmark
                  className={cn("w-6 h-6 transition-all duration-150", isSaved && "fill-current")}
                  strokeWidth={isSaved ? 0 : 2}
                />
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
            <Link
              href={user ? `/profile/${user.id}` : "#"}
              className="font-semibold text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity"
              aria-label={`${user?.name || "사용자"} 프로필 보기`}
            >
              {user?.name || "Unknown"}
            </Link>
            <span className="text-xs text-[var(--instagram-text-secondary)]">
              {formatRelativeTime(post.created_at)}
            </span>
          </div>
          <PostMenu
            isOwner={isOwner || false}
            onEdit={() => setIsEditModalOpen(true)}
            onDelete={() => setIsDeleteDialogOpen(true)}
          />
        </div>

        {/* 이미지 */}
        <div className="relative w-full bg-black flex items-center justify-center">
          <Image
            src={post.image_url}
            alt={post.caption || "게시물 이미지"}
            width={768}
            height={768}
            className="w-full h-auto max-h-[80vh] object-contain"
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
                disabled
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
          <DialogTitle className="sr-only">
            {user?.name ? `${user.name}의 게시물` : "게시물 상세"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {post?.caption ? `캡션: ${post.caption.substring(0, 50)}...` : "게시물 상세 정보를 확인하세요."}
          </DialogDescription>
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

      {/* 수정 모달 */}
      {post && (
        <EditPostModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          post={post}
          onSuccess={(updatedPost) => {
            // 모달 내부의 post 상태 먼저 업데이트
            setPost(updatedPost);
            // 게시물 업데이트 콜백 호출 (PostFeed의 handlePostUpdate로 전달되어 PostCard도 업데이트됨)
            onPostUpdate?.(post.id, updatedPost);
          }}
        />
      )}

      {/* 삭제 확인 다이얼로그 */}
      {post && (
        <DeletePostDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          postId={post.id}
          onDelete={() => {
            onPostDelete?.(post.id);
            onOpenChange(false); // 모달 닫기
          }}
        />
      )}
    </>
  );
}

export default memo(PostModal);

