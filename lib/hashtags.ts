/**
 * @file lib/hashtags.ts
 * @description 해시태그 관련 유틸리티 함수
 *
 * 해시태그 추출 및 파싱 관련 함수들을 제공합니다.
 */

/**
 * 텍스트에서 해시태그를 추출합니다.
 * #으로 시작하는 단어를 찾아 반환합니다.
 *
 * @param text - 해시태그를 추출할 텍스트
 * @returns 추출된 해시태그 이름 배열 (중복 제거, 소문자 변환)
 *
 * @example
 * extractHashtags("오늘은 #맛집 #여행 #일상") // ["맛집", "여행", "일상"]
 */
export function extractHashtags(text: string): string[] {
  if (!text || typeof text !== "string") {
    return [];
  }

  // #으로 시작하는 단어를 찾는 정규식
  // # 뒤에 공백이 아닌 문자가 1개 이상 오는 패턴
  const hashtagRegex = /#([\p{L}\p{N}_]+)/gu;
  const matches = text.matchAll(hashtagRegex);

  // 해시태그 이름 추출 및 정규화
  const hashtags = Array.from(matches, (match) => match[1].trim().toLowerCase());

  // 중복 제거
  return [...new Set(hashtags)];
}

/**
 * 해시태그 이름을 정규화합니다.
 * - 앞뒤 공백 제거
 * - 소문자 변환
 * - 특수문자 제거 (언더스코어와 하이픈은 유지)
 *
 * @param hashtag - 정규화할 해시태그 이름
 * @returns 정규화된 해시태그 이름
 */
export function normalizeHashtag(hashtag: string): string {
  return hashtag.trim().toLowerCase().replace(/[^\p{L}\p{N}_-]/gu, "");
}

