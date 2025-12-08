/**
 * @file app/(main)/profile/[userId]/page.tsx
 * @description 프로필 페이지
 *
 * Instagram 스타일의 사용자 프로필 페이지입니다.
 * - 사용자 정보 및 통계 표시
 * - 게시물 그리드 표시
 * - 팔로우/팔로잉 기능
 *
 * @see docs/PRD.md
 */

import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ProfileHeader from "@/components/profile/ProfileHeader";
import PostGrid from "@/components/profile/PostGrid";
import type { UserWithStats } from "@/lib/types";

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

/**
 * 프로필 페이지 컴포넌트
 *
 * @param params - 경로 파라미터 (userId: Clerk user ID)
 */
export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId: clerkUserId } = await params;
  const supabase = await createClient();

  // 현재 로그인 사용자 확인
  const { userId: currentClerkUserId } = await auth();
  const isOwnProfile = currentClerkUserId === clerkUserId;

  try {
    // 1. Clerk user ID로 Supabase user 조회
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !user) {
      notFound();
    }

    // 2. user_stats 뷰에서 통계 정보 조회
    const { data: userStats, error: statsError } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (statsError) {
      console.error("User stats query error:", statsError);
    }

    // 3. 현재 로그인 사용자의 팔로우 상태 확인
    let isFollowing = false;

    if (currentClerkUserId && currentClerkUserId !== clerkUserId) {
      // 현재 사용자의 Supabase user ID 조회
      const { data: currentUser } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", currentClerkUserId)
        .single();

      if (currentUser) {
        // follows 테이블에서 팔로우 관계 확인
        const { data: follow } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", currentUser.id)
          .eq("following_id", user.id)
          .single();

        isFollowing = !!follow;
      }
    }

    // 4. UserWithStats 형식으로 변환
    const userData: UserWithStats & { isFollowing: boolean } = {
      id: user.id,
      clerk_id: user.clerk_id,
      name: user.name,
      created_at: user.created_at,
      posts_count: Number(userStats?.posts_count) || 0,
      followers_count: Number(userStats?.followers_count) || 0,
      following_count: Number(userStats?.following_count) || 0,
      isFollowing,
    };

    return (
      <div className="w-full -mx-4 md:-mx-8 px-4 md:px-8 py-4 md:py-8">
        <div className="max-w-[935px] mx-auto">
          {/* 프로필 헤더 */}
          <ProfileHeader user={userData} isOwnProfile={isOwnProfile} />

          {/* 게시물 그리드 */}
          <div className="mt-8 md:mt-12">
            <PostGrid userId={userData.id} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Profile page error:", error);
    notFound();
  }
}

