-- ============================================
-- Rollback: Remove title field from posts table
-- ============================================
-- 게시물 테이블에서 제목 필드 제거 및 post_stats 뷰 원복
-- ============================================

-- posts 테이블에서 title 컬럼 제거
ALTER TABLE public.posts 
DROP COLUMN IF EXISTS title;

-- post_stats 뷰를 원래 상태로 복원 (title 필드 제거)
DROP VIEW IF EXISTS public.post_stats;

CREATE VIEW public.post_stats AS
SELECT
    p.id as post_id,
    p.user_id,
    p.image_url,
    p.caption,
    p.created_at,
    COUNT(DISTINCT l.id) as likes_count,
    COUNT(DISTINCT c.id) as comments_count
FROM public.posts p
LEFT JOIN public.likes l ON p.id = l.post_id
LEFT JOIN public.comments c ON p.id = c.post_id
GROUP BY p.id, p.user_id, p.image_url, p.caption, p.created_at;

-- 뷰 권한 부여
GRANT SELECT ON public.post_stats TO anon;
GRANT SELECT ON public.post_stats TO authenticated;
GRANT SELECT ON public.post_stats TO service_role;

