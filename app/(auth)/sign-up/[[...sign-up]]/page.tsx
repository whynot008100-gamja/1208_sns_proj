/**
 * @file app/(auth)/sign-up/[[...sign-up]]/page.tsx
 * @description Clerk 회원가입 페이지
 *
 * Clerk의 SignUp 컴포넌트를 사용하여 회원가입 기능을 제공합니다.
 */

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return <SignUp />;
}

