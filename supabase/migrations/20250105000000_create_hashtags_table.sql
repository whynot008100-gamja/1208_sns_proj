-- ============================================
-- Create Hashtags Table and Post-Hashtag Relations
-- ============================================
-- 해시태그 검색 기능을 위한 테이블 생성
-- ============================================

-- ============================================
-- 1. Hashtags 테이블 (해시태그)
-- ============================================
CREATE TABLE IF NOT EXISTS public.hashtags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,  -- 해시태그 이름 (예: "여행", "맛집")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 테이블 소유자 설정
ALTER TABLE public.hashtags OWNER TO postgres;

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_hashtags_name ON public.hashtags(name);
CREATE INDEX IF NOT EXISTS idx_hashtags_name_lower ON public.hashtags(LOWER(name));  -- 대소문자 무시 검색용

-- RLS 비활성화 (개발 단계)
ALTER TABLE public.hashtags DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.hashtags TO anon;
GRANT ALL ON TABLE public.hashtags TO authenticated;
GRANT ALL ON TABLE public.hashtags TO service_role;

-- ============================================
-- 2. Post Hashtags 테이블 (게시물-해시태그 연결)
-- ============================================
CREATE TABLE IF NOT EXISTS public.post_hashtags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    hashtag_id UUID NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- 중복 연결 방지 (같은 게시물에 같은 해시태그를 여러 번 연결할 수 없음)
    UNIQUE(post_id, hashtag_id)
);

-- 테이블 소유자 설정
ALTER TABLE public.post_hashtags OWNER TO postgres;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post_id ON public.post_hashtags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag_id ON public.post_hashtags(hashtag_id);

-- RLS 비활성화 (개발 단계)
ALTER TABLE public.post_hashtags DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.post_hashtags TO anon;
GRANT ALL ON TABLE public.post_hashtags TO authenticated;
GRANT ALL ON TABLE public.post_hashtags TO service_role;

-- ============================================
-- 3. 검색 성능 향상을 위한 인덱스 추가
-- ============================================

-- posts 테이블의 caption에 대한 텍스트 검색 인덱스 (GIN)
-- PostgreSQL의 full-text search를 위한 인덱스는 필요시 추가
-- 참고: Supabase에서는 기본적으로 ILIKE 검색이 충분히 빠름

-- users 테이블의 name에 대한 인덱스 (이미 있을 수 있지만 확인)
CREATE INDEX IF NOT EXISTS idx_users_name ON public.users(name);
CREATE INDEX IF NOT EXISTS idx_users_name_lower ON public.users(LOWER(name));  -- 대소문자 무시 검색용

-- ============================================
-- 4. 해시태그 통계 뷰 (선택사항, 검색 결과에 게시물 수 표시용)
-- ============================================
CREATE OR REPLACE VIEW public.hashtag_stats AS
SELECT
    h.id as hashtag_id,
    h.name as hashtag_name,
    h.created_at,
    COUNT(DISTINCT ph.post_id) as posts_count
FROM public.hashtags h
LEFT JOIN public.post_hashtags ph ON h.id = ph.hashtag_id
GROUP BY h.id, h.name, h.created_at;

-- 뷰 권한 부여
GRANT SELECT ON public.hashtag_stats TO anon;
GRANT SELECT ON public.hashtag_stats TO authenticated;
GRANT SELECT ON public.hashtag_stats TO service_role;

