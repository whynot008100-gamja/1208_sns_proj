/**
 * @file app/(auth)/layout.tsx
 * @description 인증 페이지 레이아웃
 *
 * 로그인/회원가입 페이지를 중앙에 배치합니다.
 * notlogin.png를 전체 화면 배경 이미지로 사용합니다.
 * 이미지가 잘리지 않고 전체가 보이도록 처리합니다.
 *
 * 이 레이아웃은 비로그인 사용자만 접근 가능합니다.
 * 로그인된 사용자는 middleware에서 메인 페이지로 리다이렉트됩니다.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-gray-900">
      {/* 전체 화면 배경 이미지 - 이미지 전체가 보이도록 */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: "url('/notlogin.png')",
          backgroundSize: "contain", // cover 대신 contain 사용
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* 콘텐츠 영역 (중앙 정렬) */}
      <div className="relative z-10 w-full h-full flex items-center justify-center overflow-y-auto p-4">
        {children}
      </div>
    </div>
  );
}
