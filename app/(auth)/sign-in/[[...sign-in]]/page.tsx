/**
 * @file app/(auth)/sign-in/[[...sign-in]]/page.tsx
 * @description Clerk 로그인 페이지
 *
 * Clerk의 SignIn 컴포넌트를 사용하여 로그인 기능을 제공합니다.
 */

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return <SignIn />;
}

