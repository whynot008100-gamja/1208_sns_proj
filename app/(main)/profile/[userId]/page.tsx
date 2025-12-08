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

import { auth, clerkClient } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getServiceRoleClient } from "@/utils/supabase/service-role";
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
    let { data: user, error: userError } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .eq("clerk_id", clerkUserId)
      .single();

    // 사용자가 없고 본인 프로필인 경우 자동 동기화 시도
    // PGRST116은 "no rows found" 오류 코드
    const isUserNotFound = userError?.code === "PGRST116" || (!user && userError);
    
    if (isUserNotFound && isOwnProfile && currentClerkUserId) {
      try {
        console.log("User not found, attempting to sync user:", {
          clerkUserId,
          errorCode: userError?.code,
          errorMessage: userError?.message,
        });
        
        // Clerk에서 사용자 정보 가져오기
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(clerkUserId);

        if (!clerkUser) {
          console.error("Clerk user not found:", clerkUserId);
        } else {
          // Supabase에 사용자 정보 동기화
          const serviceRoleClient = getServiceRoleClient();
          const { data: syncedUser, error: syncError } = await serviceRoleClient
            .from("users")
            .upsert(
              {
                clerk_id: clerkUser.id,
                name:
                  clerkUser.fullName ||
                  clerkUser.username ||
                  clerkUser.emailAddresses[0]?.emailAddress ||
                  "Unknown",
              },
              {
                onConflict: "clerk_id",
              }
            )
            .select()
            .single();

          if (syncError) {
            console.error("Failed to sync user:", {
              code: syncError.code,
              message: syncError.message,
              details: syncError.details,
              hint: syncError.hint,
            });
          } else if (syncedUser) {
            console.log("User synced successfully:", {
              id: syncedUser.id,
              clerk_id: syncedUser.clerk_id,
              name: syncedUser.name,
            });
            // 동기화된 데이터를 바로 사용
            user = {
              id: syncedUser.id,
              clerk_id: syncedUser.clerk_id,
              name: syncedUser.name,
              created_at: syncedUser.created_at,
            };
            userError = null;
          }
        }
      } catch (syncError) {
        console.error("Error syncing user:", syncError);
        // 동기화 실패해도 계속 진행
      }
    }

    // 여전히 사용자를 찾을 수 없는 경우
    if (userError || !user) {
      console.error("User not found after sync attempt:", {
        clerkUserId,
        isOwnProfile,
        currentClerkUserId,
        userError: userError ? {
          message: userError.message,
          code: userError.code,
          details: userError.details,
          hint: userError.hint,
        } : null,
        hasUser: !!user,
        attemptedSync: isUserNotFound && isOwnProfile && currentClerkUserId,
      });
      
      // 본인 프로필이고 동기화를 시도했는데도 실패한 경우
      if (isOwnProfile && currentClerkUserId) {
        console.error("Failed to sync own profile. User may need to log out and log back in.");
      }
      
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

