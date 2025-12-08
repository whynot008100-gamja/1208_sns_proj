/**
 * @file lib/clerk/localization.ts
 * @description Clerk 한국어 로컬라이제이션 설정
 *
 * Clerk 컴포넌트의 한국어 번역을 관리합니다.
 * 기본 koKR 로컬라이제이션에 커스텀 번역을 추가할 수 있습니다.
 *
 * @see https://clerk.com/docs/guides/customizing-clerk/localization
 */

import { koKR } from "@clerk/localizations";

/**
 * 커스텀 한국어 로컬라이제이션
 *
 * 기본 koKR 로컬라이제이션을 확장하여 브랜드에 맞게 텍스트를 커스터마이징할 수 있습니다.
 *
 * @example
 * ```tsx
 * import { customKoKR } from '@/lib/clerk/localization';
 *
 * <ClerkProvider localization={customKoKR}>
 *   ...
 * </ClerkProvider>
 * ```
 */
export const customKoKR = {
  ...koKR,
  
  // 커스텀 에러 메시지
  unstable__errors: {
    ...koKR.unstable__errors,
    // 예시: 특정 에러 메시지 커스터마이징
    // not_allowed_access: "접근이 허용되지 않습니다. 관리자에게 문의하세요.",
  },

  // 필요시 특정 컴포넌트의 텍스트를 커스터마이징할 수 있습니다
  // 예시:
  // signIn: {
  //   start: {
  //     title: "환영합니다",
  //     subtitle: "계속하려면 로그인하세요",
  //   },
  // },
  // signUp: {
  //   start: {
  //     title: "계정 만들기",
  //     subtitle: "새로운 계정을 만들어 시작하세요",
  //   },
  // },
};

/**
 * 기본 한국어 로컬라이제이션 (커스터마이징 없음)
 *
 * Clerk에서 제공하는 기본 한국어 번역을 그대로 사용합니다.
 */
export { koKR };

