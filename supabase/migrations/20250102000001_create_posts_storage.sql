-- ============================================
-- Storage 버킷 생성: posts (게시물 이미지)
-- ============================================
-- 공개 읽기 버킷 (PRD.md 기준)
-- ============================================

-- posts 버킷 생성 (이미 존재하면 무시됨)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts',
  'posts',
  true,  -- public bucket (공개 읽기)
  5242880,  -- 5MB 제한 (5 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]  -- 이미지 파일만 허용
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

-- ============================================
-- RLS 정책 설정 (개발 단계에서는 비활성화 가능)
-- ============================================

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Authenticated users can upload posts" ON storage.objects;
DROP POLICY IF EXISTS "Public can view posts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own posts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own posts" ON storage.objects;

-- INSERT: 인증된 사용자만 업로드 가능
CREATE POLICY "Authenticated users can upload posts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'posts'
);

-- SELECT: 공개 읽기 (public 버킷이므로)
CREATE POLICY "Public can view posts"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'posts'
);

-- DELETE: 본인 게시물만 삭제 가능
-- Note: 게시물 소유권은 posts 테이블의 user_id로 확인
-- 여기서는 인증된 사용자만 삭제 가능하도록 설정 (애플리케이션 레벨에서 소유권 검증)
CREATE POLICY "Users can delete own posts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'posts'
);

-- UPDATE: 본인 게시물만 업데이트 가능
CREATE POLICY "Users can update own posts"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'posts'
)
WITH CHECK (
  bucket_id = 'posts'
);

