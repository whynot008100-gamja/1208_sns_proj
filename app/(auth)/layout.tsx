/**
 * @file app/(auth)/layout.tsx
 * @description 인증 페이지 레이아웃
 *
 * 로그인/회원가입 페이지를 중앙에 배치합니다.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--instagram-background)]">
      {children}
    </div>
  );
}

