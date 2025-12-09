-- ============================================
-- Add title field to posts table
-- ============================================
-- 게시물 테이블에 제목 필드 추가
-- ============================================

-- posts 테이블에 title 필드 추가
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS title TEXT;

-- post_stats 뷰 업데이트 (title 필드 포함)
-- 먼저 뷰를 삭제하고 새로 생성 (컬럼 추가를 위해)
DROP VIEW IF EXISTS public.post_stats;

CREATE VIEW public.post_stats AS
SELECT
    p.id as post_id,
    p.user_id,
    p.image_url,
    p.title,
    p.caption,
    p.created_at,
    COUNT(DISTINCT l.id) as likes_count,
    COUNT(DISTINCT c.id) as comments_count
FROM public.posts p
LEFT JOIN public.likes l ON p.id = l.post_id
LEFT JOIN public.comments c ON p.id = c.post_id
GROUP BY p.id, p.user_id, p.image_url, p.title, p.caption, p.created_at;

-- 뷰 권한 부여
GRANT SELECT ON public.post_stats TO anon;
GRANT SELECT ON public.post_stats TO authenticated;
GRANT SELECT ON public.post_stats TO service_role;

