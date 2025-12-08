/**
 * @file components/profile/ProfileHeader.tsx
 * @description 프로필 헤더 컴포넌트
 *
 * Instagram 스타일의 프로필 헤더입니다.
 * - 프로필 이미지 (150px Desktop / 90px Mobile)
 * - 사용자명
 * - 통계 (게시물 수, 팔로워 수, 팔로잉 수)
 * - 팔로우/팔로잉 버튼 또는 프로필 편집 버튼
 *
 * @see docs/PRD.md
 */

"use client";

import { useState, useMemo, memo } from "react";
import { useUser } from "@clerk/nextjs";
import FollowButton from "./FollowButton";
import type { UserWithStats } from "@/lib/types";

interface ProfileHeaderProps {
  user: UserWithStats & { isFollowing: boolean };
  isOwnProfile: boolean;
  onFollowChange?: (isFollowing: boolean) => void; // 팔로우 상태 변경 시 통계 업데이트용
  onStatsUpdate?: (stats: { followers_count: number }) => void; // 통계 업데이트 콜백
}

function ProfileHeader({
  user: initialUser,
  isOwnProfile,
  onFollowChange,
  onStatsUpdate,
}: ProfileHeaderProps) {
  const { user: clerkUser } = useUser();
  const [user, setUser] = useState(initialUser);

  // 프로필 이미지 대신 이름 첫 글자로 아바타 표시
  const avatarInitial = useMemo(() => {
    return user.name.charAt(0).toUpperCase();
  }, [user.name]);

  // 팔로우 상태 변경 핸들러 (통계 업데이트 포함)
  const handleFollowChange = (isFollowing: boolean) => {
    setUser((prev) => {
      const updatedFollowersCount = isFollowing
        ? prev.followers_count + 1
        : Math.max(0, prev.followers_count - 1);
      
      // 통계 업데이트 콜백 호출
      onStatsUpdate?.({
        followers_count: updatedFollowersCount,
      });
      
      return {
        ...prev,
        isFollowing,
        followers_count: updatedFollowersCount,
      };
    });
    onFollowChange?.(isFollowing);
  };

  return (
    <div className="w-full">
      {/* Desktop 레이아웃 */}
      <div className="hidden md:flex items-start gap-8 px-4 py-8">
        {/* 프로필 이미지: 150px 원형 */}
        <div className="flex-shrink-0">
          <div className="w-[150px] h-[150px] rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300">
            <span className="text-5xl font-semibold text-gray-600">
              {avatarInitial}
            </span>
          </div>
        </div>

        {/* 사용자 정보 영역 */}
        <div className="flex-1 min-w-0">
          {/* 사용자명 및 버튼 */}
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-2xl font-light text-[var(--instagram-text-primary)]">
              {user.name}
            </h1>

            {/* 버튼 영역 */}
            {isOwnProfile ? (
              // 본인 프로필: 프로필 편집 버튼 (1차 제외)
              <button
                className="px-4 py-1.5 bg-[var(--instagram-card-background)] border border-[var(--instagram-border)] rounded-lg font-semibold text-sm text-[var(--instagram-text-primary)] hover:bg-gray-50 transition-colors"
                disabled
                aria-label="프로필 편집"
              >
                프로필 편집
              </button>
            ) : (
              // 다른 사람 프로필: 팔로우 버튼
              <FollowButton
                followingId={user.id}
                initialIsFollowing={user.isFollowing}
                onFollowChange={handleFollowChange}
              />
            )}
          </div>

          {/* 통계 */}
          <div className="flex items-center gap-8 mb-4">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-[var(--instagram-text-primary)]">
                {user.posts_count.toLocaleString()}
              </span>
              <span className="text-[var(--instagram-text-primary)]">
                게시물
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-[var(--instagram-text-primary)]">
                {user.followers_count.toLocaleString()}
              </span>
              <span className="text-[var(--instagram-text-primary)]">
                팔로워
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-[var(--instagram-text-primary)]">
                {user.following_count.toLocaleString()}
              </span>
              <span className="text-[var(--instagram-text-primary)]">
                팔로잉
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile 레이아웃 */}
      <div className="md:hidden px-4 py-4">
        {/* 프로필 이미지 및 사용자명 */}
        <div className="flex items-center gap-4 mb-4">
          {/* 프로필 이미지: 90px 원형 */}
          <div className="w-[90px] h-[90px] rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300 flex-shrink-0">
            <span className="text-3xl font-semibold text-gray-600">
              {avatarInitial}
            </span>
          </div>

          {/* 통계 (Mobile) */}
          <div className="flex-1 flex items-center justify-around">
            <div className="flex flex-col items-center">
              <span className="font-semibold text-[var(--instagram-text-primary)]">
                {user.posts_count.toLocaleString()}
              </span>
              <span className="text-xs text-[var(--instagram-text-primary)]">
                게시물
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-semibold text-[var(--instagram-text-primary)]">
                {user.followers_count.toLocaleString()}
              </span>
              <span className="text-xs text-[var(--instagram-text-primary)]">
                팔로워
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-semibold text-[var(--instagram-text-primary)]">
                {user.following_count.toLocaleString()}
              </span>
              <span className="text-xs text-[var(--instagram-text-primary)]">
                팔로잉
              </span>
            </div>
          </div>
        </div>

        {/* 사용자명 및 버튼 */}
        <div className="mb-4">
          <h1 className="text-sm font-semibold text-[var(--instagram-text-primary)] mb-3">
            {user.name}
          </h1>

          {/* 버튼 영역 */}
          {isOwnProfile ? (
            <button
              className="w-full px-4 py-1.5 bg-[var(--instagram-card-background)] border border-[var(--instagram-border)] rounded-lg font-semibold text-sm text-[var(--instagram-text-primary)] hover:bg-gray-50 transition-colors"
              disabled
              aria-label="프로필 편집"
            >
              프로필 편집
            </button>
          ) : (
            <FollowButton
              followingId={user.id}
              initialIsFollowing={user.isFollowing}
              onFollowChange={handleFollowChange}
              className="w-full"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(ProfileHeader);

