/**
 * @file app/(auth)/sign-in/[[...sign-in]]/page.tsx
 * @description 비로그인 랜딩 페이지
 *
 * wallpaper.webp를 배경으로 사용하는 랜딩 페이지입니다.
 * 로그인/회원가입 버튼을 배치하고, 클릭 시 Clerk 모달을 엽니다.
 */

"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative">
      {/* 버튼 컨테이너 */}
      <div className="flex flex-col gap-4 z-20 w-full max-w-xs">
        {/* 로그인 버튼 */}
        <SignInButton mode="modal">
          <button
            className="w-full py-4 px-6 rounded-xl text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: "#3B82F6",
            }}
          >
            로그인
          </button>
        </SignInButton>

        {/* 회원가입 버튼 */}
        <SignUpButton mode="modal">
          <button
            className="w-full py-4 px-6 rounded-xl text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: "#F59E0B",
            }}
          >
            가입하기
          </button>
        </SignUpButton>
      </div>
    </div>
  );
}

