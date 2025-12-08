# Clerk 한국어 로컬라이제이션 가이드

이 문서는 Clerk 컴포넌트를 한국어로 설정하는 방법을 설명합니다.

## 현재 설정

프로젝트에는 이미 Clerk 한국어 로컬라이제이션이 적용되어 있습니다:

- **패키지**: `@clerk/localizations` (v3.26.3)
- **로컬라이제이션**: `koKR` (한국어)
- **적용 위치**: `app/layout.tsx`의 `ClerkProvider`

## 설정 방법

### 1. 기본 한국어 로컬라이제이션

`app/layout.tsx`에서 `ClerkProvider`에 한국어 로컬라이제이션을 적용합니다:

```tsx
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";

export default function RootLayout({ children }) {
  return (
    <ClerkProvider localization={koKR}>
      <html lang="ko">
        {/* ... */}
      </html>
    </ClerkProvider>
  );
}
```

### 2. 커스텀 한국어 로컬라이제이션

기본 번역을 수정하거나 추가 번역을 적용하려면 `lib/clerk/localization.ts`를 수정하세요:

```tsx
import { koKR } from "@clerk/localizations";

export const customKoKR = {
  ...koKR,
  signIn: {
    start: {
      title: "환영합니다",
      subtitle: "계속하려면 로그인하세요",
    },
  },
  unstable__errors: {
    not_allowed_access: "접근이 허용되지 않습니다. 관리자에게 문의하세요.",
  },
};
```

그리고 `app/layout.tsx`에서 사용:

```tsx
import { customKoKR } from "@/lib/clerk/localization";

<ClerkProvider localization={customKoKR}>
  {/* ... */}
</ClerkProvider>
```

## 지원되는 언어

Clerk는 다음 언어를 지원합니다:

- 한국어 (ko-KR): `koKR`
- 영어 (en-US): `enUS` (기본값)
- 일본어 (ja-JP): `jaJP`
- 중국어 간체 (zh-CN): `zhCN`
- 중국어 번체 (zh-TW): `zhTW`
- 기타 50개 이상의 언어

전체 언어 목록은 [Clerk 공식 문서](https://clerk.com/docs/guides/customizing-clerk/localization)를 참고하세요.

## 커스터마이징 가능한 영역

### 1. 로그인/회원가입 텍스트

```tsx
const customKoKR = {
  ...koKR,
  signIn: {
    start: {
      title: "로그인",
      subtitle: "계속하려면 로그인하세요",
    },
  },
  signUp: {
    start: {
      title: "회원가입",
      subtitle: "새로운 계정을 만들어 시작하세요",
    },
  },
};
```

### 2. 에러 메시지

```tsx
const customKoKR = {
  ...koKR,
  unstable__errors: {
    not_allowed_access: "접근이 허용되지 않습니다.",
    form_identifier_not_found: "사용자를 찾을 수 없습니다.",
    form_password_pwned: "이 비밀번호는 보안상 위험합니다. 다른 비밀번호를 사용하세요.",
    // ... 기타 에러 메시지
  },
};
```

### 3. 버튼 텍스트

```tsx
const customKoKR = {
  ...koKR,
  formButtonPrimary: "제출",
  formButtonReset: "초기화",
  // ... 기타 버튼 텍스트
};
```

## 주의사항

### 실험적 기능

로컬라이제이션 기능은 현재 **실험적(experimental)** 단계입니다:
- 예상치 못한 동작이 발생할 수 있습니다
- 문제가 발생하면 [Clerk 지원팀](https://clerk.com/contact/support)에 문의하세요

### 제한사항

- **Clerk 컴포넌트만 번역**: 앱 내의 Clerk 컴포넌트만 한국어로 표시됩니다
- **Account Portal은 영어**: Clerk 호스팅 Account Portal은 여전히 영어로 표시됩니다
- **일부 텍스트 미번역**: 일부 동적 텍스트는 번역되지 않을 수 있습니다

## 테스트 방법

1. 개발 서버 실행: `pnpm dev`
2. 브라우저에서 `/sign-in` 또는 `/sign-up` 페이지 접속
3. Clerk 컴포넌트가 한국어로 표시되는지 확인

## 참고 자료

- [Clerk 로컬라이제이션 공식 문서](https://clerk.com/docs/guides/customizing-clerk/localization)
- [Clerk Next.js 문서](https://clerk.com/docs/reference/nextjs/overview)
- [한국어 로컬라이제이션 소스 코드](https://github.com/clerk/javascript/blob/main/packages/localizations/src/ko-KR.ts)

## 현재 프로젝트 설정

프로젝트의 현재 설정:

- **로컬라이제이션 파일**: `lib/clerk/localization.ts`
- **적용 위치**: `app/layout.tsx`
- **HTML lang 속성**: `lang="ko"`
- **Tailwind CSS v4 호환성**: `cssLayerName: "clerk"` 설정됨

## 커스터마이징 예시

더 많은 커스터마이징이 필요한 경우, `lib/clerk/localization.ts` 파일을 수정하세요:

```tsx
import { koKR } from "@clerk/localizations";

export const customKoKR = {
  ...koKR,
  
  // 로그인 페이지 커스터마이징
  signIn: {
    start: {
      title: "{{applicationName}}에 로그인",
      subtitle: "계속하려면 로그인하세요",
    },
  },
  
  // 회원가입 페이지 커스터마이징
  signUp: {
    start: {
      title: "{{applicationName}} 계정 만들기",
      subtitle: "새로운 계정을 만들어 시작하세요",
    },
  },
  
  // 에러 메시지 커스터마이징
  unstable__errors: {
    not_allowed_access: "이 이메일 도메인은 접근이 허용되지 않습니다. 관리자에게 문의하세요.",
  },
};
```

## 문제 해결

### 한국어가 표시되지 않는 경우

1. `@clerk/localizations` 패키지가 설치되어 있는지 확인
2. `koKR`이 올바르게 import되었는지 확인
3. `ClerkProvider`에 `localization` prop이 전달되었는지 확인
4. 브라우저 캐시를 지우고 다시 시도

### 일부 텍스트가 영어로 표시되는 경우

- Clerk Account Portal은 항상 영어로 표시됩니다
- 일부 동적 텍스트는 번역되지 않을 수 있습니다
- 커스텀 로컬라이제이션에서 해당 텍스트를 직접 설정하세요

