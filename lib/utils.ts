import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 상대 시간 포맷팅 함수
 * 
 * @param date - ISO timestamp string 또는 Date 객체
 * @returns 상대 시간 문자열 (예: "방금 전", "3분 전", "2시간 전", "3일 전")
 * 
 * @example
 * ```ts
 * formatRelativeTime("2025-01-02T10:00:00Z") // "3시간 전"
 * formatRelativeTime(new Date()) // "방금 전"
 * ```
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const target = typeof date === "string" ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "방금 전";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}주 전`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}개월 전`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}년 전`;
}

/**
 * 텍스트를 지정된 줄 수로 자르고 "... 더 보기" 버튼 추가
 * 
 * @param text - 원본 텍스트
 * @param maxLines - 최대 줄 수 (기본값: 2)
 * @returns { text: string, isTruncated: boolean }
 * 
 * @example
 * ```ts
 * truncateText("긴 텍스트...", 2) // { text: "긴 텍스트...", isTruncated: true }
 * ```
 */
export function truncateText(text: string, maxLines: number = 2): {
  text: string;
  isTruncated: boolean;
} {
  // 간단한 구현: 실제로는 CSS line-clamp를 사용하는 것이 더 나음
  // 이 함수는 텍스트가 잘렸는지만 확인
  const lines = text.split("\n");
  const isTruncated = lines.length > maxLines;
  
  if (isTruncated) {
    return {
      text: lines.slice(0, maxLines).join("\n"),
      isTruncated: true,
    };
  }
  
  return {
    text,
    isTruncated: false,
  };
}

/**
 * 이미지 파일 검증
 * 
 * @param file - 검증할 파일
 * @param maxSizeMB - 최대 크기 (MB, 기본값: 5)
 * @returns { valid: boolean, error?: string }
 * 
 * @example
 * ```ts
 * const result = validateImageFile(file);
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 5
): { valid: boolean; error?: string } {
  // 파일 타입 검증
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "JPEG, PNG, WebP 이미지만 업로드할 수 있습니다.",
    };
  }

  // 파일 크기 검증
  const maxSizeBytes = maxSizeMB * 1024 * 1024; // MB를 bytes로 변환
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `이미지 크기는 ${maxSizeMB}MB 이하여야 합니다.`,
    };
  }

  return { valid: true };
}

/**
 * 에러를 사용자 친화적인 메시지로 변환
 * 
 * @param error - 에러 객체 또는 문자열
 * @param defaultMessage - 기본 에러 메시지
 * @returns 사용자 친화적인 에러 메시지
 * 
 * @example
 * ```ts
 * try {
 *   await fetch('/api/posts');
 * } catch (error) {
 *   const message = getErrorMessage(error, "게시물을 불러오는데 실패했습니다.");
 *   alert(message);
 * }
 * ```
 */
export function getErrorMessage(
  error: unknown,
  defaultMessage: string = "작업에 실패했습니다."
): string {
  // 네트워크 에러
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return "인터넷 연결을 확인해주세요.";
  }

  // Error 객체
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }

  // 문자열
  if (typeof error === "string") {
    return error;
  }

  // 기타
  return defaultMessage;
}
