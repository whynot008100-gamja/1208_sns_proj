-- ============================================
-- Saves 테이블 (게시물 저장/북마크)
-- ============================================
-- 사용자가 저장한 게시물을 관리하는 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS public.saves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

    -- 중복 저장 방지 (같은 사용자가 같은 게시물에 여러 번 저장 불가)
    UNIQUE(post_id, user_id)
);

-- 테이블 소유자 설정
ALTER TABLE public.saves OWNER TO postgres;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_saves_user_id ON public.saves(user_id);
CREATE INDEX IF NOT EXISTS idx_saves_post_id ON public.saves(post_id);
CREATE INDEX IF NOT EXISTS idx_saves_created_at ON public.saves(created_at DESC);

-- RLS 비활성화 (개발 단계)
ALTER TABLE public.saves DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.saves TO anon;
GRANT ALL ON TABLE public.saves TO authenticated;
GRANT ALL ON TABLE public.saves TO service_role;

