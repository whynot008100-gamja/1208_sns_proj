-- ============================================
-- Extract Hashtags from Existing Posts
-- ============================================
-- 기존 게시물의 caption에서 해시태그를 추출하여 저장
-- ============================================

-- 해시태그 추출 함수 (PostgreSQL)
CREATE OR REPLACE FUNCTION extract_hashtags_from_text(text_content TEXT)
RETURNS TEXT[] AS $$
DECLARE
  hashtags TEXT[];
  match_result TEXT;
BEGIN
  hashtags := ARRAY[]::TEXT[];
  
  -- #으로 시작하는 단어를 찾아 배열로 반환
  FOR match_result IN
    SELECT LOWER(SUBSTRING(match[1] FROM 2)) -- # 제거하고 소문자 변환
    FROM regexp_matches(text_content, '#([\w가-힣]+)', 'g') AS match
  LOOP
    -- 중복 제거를 위해 배열에 추가 전 확인
    IF NOT (match_result = ANY(hashtags)) THEN
      hashtags := array_append(hashtags, match_result);
    END IF;
  END LOOP;
  
  RETURN hashtags;
END;
$$ LANGUAGE plpgsql;

-- 기존 게시물의 caption에서 해시태그 추출 및 저장
DO $$
DECLARE
  post_record RECORD;
  hashtag_names TEXT[];
  hashtag_name TEXT;
  hashtag_id UUID;
  existing_hashtag RECORD;
BEGIN
  -- 모든 게시물을 순회
  FOR post_record IN
    SELECT id, caption
    FROM public.posts
    WHERE caption IS NOT NULL AND caption != ''
  LOOP
    -- 해시태그 추출
    hashtag_names := extract_hashtags_from_text(post_record.caption);
    
    -- 각 해시태그에 대해 처리
    FOREACH hashtag_name IN ARRAY hashtag_names
    LOOP
      -- 해시태그가 이미 존재하는지 확인
      SELECT id INTO existing_hashtag
      FROM public.hashtags
      WHERE name = hashtag_name
      LIMIT 1;
      
      IF existing_hashtag IS NULL THEN
        -- 해시태그가 없으면 생성
        INSERT INTO public.hashtags (name)
        VALUES (hashtag_name)
        RETURNING id INTO hashtag_id;
      ELSE
        hashtag_id := existing_hashtag.id;
      END IF;
      
      -- 게시물-해시태그 연결 (중복 방지)
      INSERT INTO public.post_hashtags (post_id, hashtag_id)
      VALUES (post_record.id, hashtag_id)
      ON CONFLICT (post_id, hashtag_id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- 함수 정리 (선택사항: 함수를 유지할지 삭제할지 결정)
-- DROP FUNCTION IF EXISTS extract_hashtags_from_text(TEXT);

