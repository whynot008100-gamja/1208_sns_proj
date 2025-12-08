/**
 * @file components/profile/FollowButton.tsx
 * @description 팔로우 버튼 컴포넌트
 *
 * Instagram 스타일의 팔로우/팔로잉 버튼입니다.
 * - 미팔로우: "팔로우" 버튼 (파란색)
 * - 팔로우 중: "팔로잉" 버튼 (회색)
 * - Hover 시: "언팔로우" (빨간 테두리)
 *
 * @see docs/PRD.md
 */

"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  followingId: string; // Supabase user ID
  initialIsFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void; // 팔로우 상태 변경 콜백
  className?: string;
}

export default function FollowButton({
  followingId,
  initialIsFollowing,
  onFollowChange,
  className,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const handleFollow = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    const previousState = isFollowing;

    try {
      if (isFollowing) {
        // 팔로우 취소
        const response = await fetch(
          `/api/follows?followingId=${followingId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "팔로우 취소에 실패했습니다.");
        }

        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        // 팔로우 추가
        const response = await fetch("/api/follows", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ followingId }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "팔로우에 실패했습니다.");
        }

        setIsFollowing(true);
        onFollowChange?.(true);
      }
    } catch (error) {
      console.error("Follow action error:", error);
      // 에러 발생 시 이전 상태로 롤백
      setIsFollowing(previousState);
      
      let errorMessage = "작업에 실패했습니다.";
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        errorMessage = "인터넷 연결을 확인해주세요.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isFollowing, followingId, onFollowChange]);

  // 버튼 텍스트 결정
  const getButtonText = () => {
    if (isLoading) {
      return "처리 중...";
    }

    if (isFollowing) {
      if (isHovering) {
        return "언팔로우";
      }
      return "팔로잉";
    }

    return "팔로우";
  };

  // 버튼 스타일 결정
  const getButtonStyle = () => {
    if (isFollowing) {
      if (isHovering) {
        // Hover 시: 빨간 테두리
        return "bg-white border-red-500 text-red-500 hover:bg-red-50";
      }
      // 팔로잉: 회색 테두리
      return "bg-white border-gray-300 text-gray-900 hover:bg-gray-50";
    }
    // 팔로우: 파란색 배경
    return "bg-[var(--instagram-blue)] text-white hover:bg-[#0084d4]";
  };

  return (
    <Button
      onClick={handleFollow}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      disabled={isLoading}
      className={cn(
        "px-6 py-2 rounded-lg font-semibold text-sm transition-colors",
        "border",
        getButtonStyle(),
        className
      )}
      aria-label={isLoading ? "처리 중" : isFollowing ? (isHovering ? "언팔로우" : "팔로잉 중") : "팔로우"}
      aria-busy={isLoading}
    >
      {getButtonText()}
    </Button>
  );
}

