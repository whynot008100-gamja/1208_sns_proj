-- ============================================
-- Storage 버킷 업데이트: posts (게시물 이미지 + 동영상)
-- ============================================
-- 공개 읽기 버킷
-- 파일 크기 제한: 5MB → 50MB
-- 동영상 MIME 타입 추가
-- ============================================

-- posts 버킷 설정 업데이트
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts',
  'posts',
  true,  -- public bucket (공개 읽기)
  52428800,  -- 50MB 제한 (50 * 1024 * 1024)
  ARRAY[
    'image/jpeg', 
    'image/png', 
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo'  -- AVI
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'image/jpeg', 
    'image/png', 
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo'
  ]::text[];

