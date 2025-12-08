/**
 * @file lib/types.ts
 * @description TypeScript 타입 정의
 *
 * Instagram Clone SNS 프로젝트의 데이터베이스 스키마를 기반으로 한 타입 정의입니다.
 * Supabase 테이블 구조와 뷰를 반영합니다.
 *
 * @see supabase/migrations/DB.sql
 */

// ============================================
// 기본 테이블 타입
// ============================================

/**
 * 사용자 정보
 * @see supabase/migrations/setup_schema.sql
 */
export interface User {
  id: string; // UUID
  clerk_id: string; // Clerk User ID
  name: string;
  created_at: string; // ISO timestamp
}

/**
 * 게시물
 * @see supabase/migrations/20250102000000_create_instagram_schema.sql
 */
export interface Post {
  id: string; // UUID
  user_id: string; // UUID
  image_url: string; // Supabase Storage URL
  caption: string | null; // 최대 2,200자
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * 좋아요
 */
export interface Like {
  id: string; // UUID
  post_id: string; // UUID
  user_id: string; // UUID
  created_at: string; // ISO timestamp
}

/**
 * 댓글
 */
export interface Comment {
  id: string; // UUID
  post_id: string; // UUID
  user_id: string; // UUID
  content: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * 팔로우 관계
 */
export interface Follow {
  id: string; // UUID
  follower_id: string; // UUID - 팔로우하는 사람
  following_id: string; // UUID - 팔로우받는 사람
  created_at: string; // ISO timestamp
}

// ============================================
// 뷰 타입 (통계)
// ============================================

/**
 * 게시물 통계 뷰
 * @see post_stats view
 */
export interface PostStats {
  post_id: string; // UUID
  user_id: string; // UUID
  image_url: string;
  caption: string | null;
  created_at: string; // ISO timestamp
  likes_count: number;
  comments_count: number;
}

/**
 * 사용자 통계 뷰
 * @see user_stats view
 */
export interface UserStats {
  user_id: string; // UUID
  clerk_id: string;
  name: string;
  posts_count: number;
  followers_count: number; // 나를 팔로우하는 사람들
  following_count: number; // 내가 팔로우하는 사람들
}

// ============================================
// 관계 타입 (확장)
// ============================================

/**
 * 게시물 + 통계 정보
 */
export interface PostWithStats extends Post {
  likes_count: number;
  comments_count: number;
}

/**
 * 사용자 + 통계 정보
 */
export interface UserWithStats extends User {
  posts_count: number;
  followers_count: number;
  following_count: number;
}

/**
 * 게시물 + 사용자 정보 + 통계
 */
export interface PostWithUserAndStats extends PostWithStats {
  user: User;
}

/**
 * 댓글 + 사용자 정보
 */
export interface CommentWithUser extends Comment {
  user: User;
}

/**
 * 좋아요 + 사용자 정보
 */
export interface LikeWithUser extends Like {
  user: User;
}

// ============================================
// 유틸리티 타입
// ============================================

/**
 * 데이터베이스에서 가져온 타임스탬프를 Date로 변환
 */
export type Timestamp = string; // ISO timestamp string

/**
 * UUID 타입
 */
export type UUID = string;

