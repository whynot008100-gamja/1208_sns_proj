-- RLS 정책 예시 (프로덕션용)
-- 
-- 주의: 이 파일은 예시입니다. 실제 사용 시에는 테이블 구조에 맞게 수정하세요.
-- 개발 환경에서는 RLS를 비활성화할 수 있지만, 프로덕션에서는 반드시 활성화해야 합니다.
--
-- 사용 방법:
-- 1. 이 파일을 참고하여 실제 테이블에 맞는 RLS 정책 작성
-- 2. 마이그레이션 파일로 실행: supabase migration new setup_rls_policies
-- 3. 또는 Supabase Dashboard의 SQL Editor에서 직접 실행

-- ============================================
-- 예시 1: tasks 테이블에 대한 RLS 정책
-- ============================================

-- 테이블 생성 (예시)
-- CREATE TABLE IF NOT EXISTS public.tasks (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     name TEXT NOT NULL,
--     user_id TEXT NOT NULL, -- Clerk user ID 저장
--     created_at TIMESTAMPTZ DEFAULT now() NOT NULL
-- );

-- RLS 활성화
-- ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- SELECT 정책: 사용자는 자신의 tasks만 조회 가능
-- CREATE POLICY "Users can view their own tasks"
-- ON public.tasks
-- FOR SELECT
-- TO authenticated
-- USING (
--     (SELECT auth.jwt()->>'sub') = user_id::text
-- );

-- INSERT 정책: 사용자는 자신의 tasks만 생성 가능
-- CREATE POLICY "Users can insert their own tasks"
-- ON public.tasks
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (
--     (SELECT auth.jwt()->>'sub') = user_id::text
-- );

-- UPDATE 정책: 사용자는 자신의 tasks만 수정 가능
-- CREATE POLICY "Users can update their own tasks"
-- ON public.tasks
-- FOR UPDATE
-- TO authenticated
-- USING (
--     (SELECT auth.jwt()->>'sub') = user_id::text
-- )
-- WITH CHECK (
--     (SELECT auth.jwt()->>'sub') = user_id::text
-- );

-- DELETE 정책: 사용자는 자신의 tasks만 삭제 가능
-- CREATE POLICY "Users can delete their own tasks"
-- ON public.tasks
-- FOR DELETE
-- TO authenticated
-- USING (
--     (SELECT auth.jwt()->>'sub') = user_id::text
-- );

-- ============================================
-- 예시 2: users 테이블에 대한 RLS 정책
-- ============================================

-- users 테이블의 경우, clerk_id로 사용자를 식별
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- SELECT 정책: 사용자는 자신의 정보만 조회 가능
-- CREATE POLICY "Users can view their own profile"
-- ON public.users
-- FOR SELECT
-- TO authenticated
-- USING (
--     (SELECT auth.jwt()->>'sub') = clerk_id::text
-- );

-- INSERT 정책: 사용자는 자신의 정보만 생성 가능
-- CREATE POLICY "Users can insert their own profile"
-- ON public.users
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (
--     (SELECT auth.jwt()->>'sub') = clerk_id::text
-- );

-- UPDATE 정책: 사용자는 자신의 정보만 수정 가능
-- CREATE POLICY "Users can update their own profile"
-- ON public.users
-- FOR UPDATE
-- TO authenticated
-- USING (
--     (SELECT auth.jwt()->>'sub') = clerk_id::text
-- )
-- WITH CHECK (
--     (SELECT auth.jwt()->>'sub') = clerk_id::text
-- );

-- DELETE 정책: 사용자는 자신의 정보만 삭제 가능 (일반적으로 비활성화)
-- CREATE POLICY "Users can delete their own profile"
-- ON public.users
-- FOR DELETE
-- TO authenticated
-- USING (
--     (SELECT auth.jwt()->>'sub') = clerk_id::text
-- );

-- ============================================
-- 예시 3: 공개 데이터 조회 (anon 사용자도 접근 가능)
-- ============================================

-- 공개 게시물 테이블 예시
-- CREATE TABLE IF NOT EXISTS public.posts (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     title TEXT NOT NULL,
--     content TEXT NOT NULL,
--     author_id TEXT NOT NULL, -- Clerk user ID
--     is_public BOOLEAN DEFAULT false,
--     created_at TIMESTAMPTZ DEFAULT now() NOT NULL
-- );

-- ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- SELECT 정책: 공개 게시물은 누구나 조회 가능, 비공개는 작성자만
-- CREATE POLICY "Anyone can view public posts, authors can view their own"
-- ON public.posts
-- FOR SELECT
-- TO public
-- USING (
--     is_public = true
--     OR
--     (SELECT auth.jwt()->>'sub') = author_id::text
-- );

-- INSERT 정책: 인증된 사용자만 게시물 생성 가능
-- CREATE POLICY "Authenticated users can create posts"
-- ON public.posts
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (
--     (SELECT auth.jwt()->>'sub') = author_id::text
-- );

-- UPDATE 정책: 작성자만 자신의 게시물 수정 가능
-- CREATE POLICY "Authors can update their own posts"
-- ON public.posts
-- FOR UPDATE
-- TO authenticated
-- USING (
--     (SELECT auth.jwt()->>'sub') = author_id::text
-- )
-- WITH CHECK (
--     (SELECT auth.jwt()->>'sub') = author_id::text
-- );

-- DELETE 정책: 작성자만 자신의 게시물 삭제 가능
-- CREATE POLICY "Authors can delete their own posts"
-- ON public.posts
-- FOR DELETE
-- TO authenticated
-- USING (
--     (SELECT auth.jwt()->>'sub') = author_id::text
-- );

-- ============================================
-- RLS 정책 확인 쿼리
-- ============================================

-- 모든 테이블의 RLS 상태 확인
-- SELECT
--     schemaname,
--     tablename,
--     rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;

-- 특정 테이블의 RLS 정책 확인
-- SELECT
--     schemaname,
--     tablename,
--     policyname,
--     permissive,
--     roles,
--     cmd,
--     qual,
--     with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
--     AND tablename = 'tasks'
-- ORDER BY policyname;

-- ============================================
-- RLS 비활성화 (개발 환경용)
-- ============================================

-- 특정 테이블의 RLS 비활성화
-- ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;

-- 모든 정책 삭제
-- DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
-- DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
-- DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
-- DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;

