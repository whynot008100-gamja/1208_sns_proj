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
  onLike?: (postId: string, isLiked: boolean) => void; // 좋아요 상태 변경 시 호출
  onComment?: (postId: string) => void;
  onImageClick?: (postId: string) => void; // 이미지 클릭 시 모달 열기
  onDelete?: (postId: string) => void; // 게시물 삭제 시 콜백
  onPostUpdate?: (postId: string, updates: Partial<PostWithStats>) => void; // 게시물 업데이트 콜백
  isPriority?: boolean; // LCP 이미지 최적화용
}

function PostCard({
  post,
  user,
  currentUserId,
  onLike,
  onComment,
  onImageClick,
  onDelete,
  onPostUpdate,
  isPriority = false,
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
  const [isSaved, setIsSaved] = useState(false);

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

  // 좋아요 상태 확인 (supabaseUserId가 있을 때)
  useEffect(() => {
    if (!supabaseUserId) return;

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
        // 좋아요가 없는 경우 (에러 코드 406 또는 PGRST116)
        setIsLiked(false);
      }
    };

    checkLikeStatus();
  }, [supabaseUserId, post.id, supabase]);

  // 저장 상태 확인 (supabaseUserId가 있을 때)
  useEffect(() => {
    if (!supabaseUserId) return;

    const checkSaveStatus = async () => {
      try {
        const response = await fetch(`/api/saves?postId=${post.id}`);
        if (response.ok) {
          const data = await response.json();
          setIsSaved(data.isSaved || false);
        }
      } catch (err) {
        console.error("Failed to check save status:", err);
        setIsSaved(false);
      }
    };

    checkSaveStatus();
  }, [supabaseUserId, post.id]);

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
        
        // 댓글 수 업데이트
        onPostUpdate?.(post.id, {
          comments_count: post.comments_count + 1,
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
        // 댓글 수 업데이트
        onPostUpdate?.(post.id, {
          comments_count: Math.max(0, post.comments_count - 1),
        });
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
          priority={isPriority}
          loading={isPriority ? "eager" : "lazy"}
          onDoubleClick={async (e) => {
            e.stopPropagation(); // 모달 열기 방지
            // 더블탭 좋아요
            if (!isLiked) {
              setIsLiked(true); // 낙관적 업데이트
              
              try {
                const response = await fetch("/api/likes", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ postId: post.id }),
                });

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  // 409 (이미 좋아요를 누른 경우)는 무시
                  if (response.status !== 409) {
                    throw new Error(errorData.error || "좋아요 추가에 실패했습니다.");
                  }
                }

                // 성공 시 콜백 호출 (좋아요 수 업데이트용)
                onLike?.(post.id, true);
              } catch (err) {
                // 에러 발생 시 상태 롤백
                setIsLiked(false);
                console.error("Double tap like error:", err);
              }
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
              "transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-[#0095f6] focus:ring-offset-2 rounded",
              isAnimating && "scale-[1.3]",
              isLiked
                ? "text-[var(--instagram-like)]"
                : "text-[var(--instagram-text-primary)]"
            )}
            onClick={async () => {
              setIsAnimating(true);
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
                    body: JSON.stringify({ postId: post.id }),
                  });

                  if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    // 409 (이미 좋아요를 누른 경우)는 무시
                    if (response.status !== 409) {
                      throw new Error(errorData.error || "좋아요 추가에 실패했습니다.");
                    }
                  }
                } else {
                  // 좋아요 제거
                  const response = await fetch(`/api/likes?postId=${post.id}`, {
                    method: "DELETE",
                  });

                  if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || "좋아요 제거에 실패했습니다.");
                  }
                }

                // 성공 시 콜백 호출 (좋아요 수 업데이트용)
                onLike?.(post.id, newLikedState);
              } catch (err) {
                // 에러 발생 시 상태 롤백
                setIsLiked(!newLikedState);
                console.error("Like error:", err);
                let errorMessage = "좋아요 처리에 실패했습니다.";
                if (err instanceof TypeError && err.message === "Failed to fetch") {
                  errorMessage = "인터넷 연결을 확인해주세요.";
                } else if (err instanceof Error) {
                  errorMessage = err.message;
                }
                alert(errorMessage);
              } finally {
                setTimeout(() => setIsAnimating(false), 150);
              }
            }}
            aria-label={isLiked ? "좋아요 취소" : "좋아요"}
            type="button"
          >
            <Heart
              className={cn("w-6 h-6 transition-all duration-150", isLiked && "fill-current")}
              strokeWidth={isLiked ? 0 : 2}
              aria-hidden="true"
            />
          </button>

          {/* 댓글 버튼 */}
          <button
            className="text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#0095f6] focus:ring-offset-2 rounded"
            onClick={() => {
              onImageClick?.(post.id); // 댓글 버튼 클릭 시 모달 열기
              onComment?.(post.id);
            }}
            aria-label="댓글"
            type="button"
          >
            <MessageCircle className="w-6 h-6" aria-hidden="true" />
          </button>

          {/* 공유 버튼 */}
          <button
            className="text-[var(--instagram-text-primary)] hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#0095f6] focus:ring-offset-2 rounded"
            onClick={async () => {
              try {
                // 게시물 URL 생성
                const postUrl = `${window.location.origin}/post/${post.id}`;
                
                // 클립보드에 복사
                await navigator.clipboard.writeText(postUrl);
                
                // 성공 피드백 (간단한 alert 사용)
                alert("링크가 클립보드에 복사되었습니다!");
              } catch (err) {
                console.error("Failed to copy URL:", err);
                alert("링크 복사에 실패했습니다.");
              }
            }}
            aria-label="공유"
            type="button"
          >
            <Send className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        {/* 북마크 버튼 */}
        <button
          className={cn(
            "transition-opacity focus:outline-none focus:ring-2 focus:ring-[#0095f6] focus:ring-offset-2 rounded",
            isSaved
              ? "text-[var(--instagram-text-primary)]"
              : "text-[var(--instagram-text-primary)] hover:opacity-70"
          )}
          onClick={async () => {
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
                  body: JSON.stringify({ postId: post.id }),
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
                  
                  // 409 (이미 저장한 경우)는 무시
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
                const response = await fetch(`/api/saves?postId=${post.id}`, {
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
          }}
          aria-label={isSaved ? "저장 취소" : "저장"}
          type="button"
        >
          <Bookmark
            className={cn("w-6 h-6 transition-all duration-150", isSaved && "fill-current")}
            strokeWidth={isSaved ? 0 : 2}
            aria-hidden="true"
          />
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

