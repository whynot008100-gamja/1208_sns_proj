/**
 * @file app/(main)/layout.tsx
 * @description Instagram Clone 메인 레이아웃
 *
 * Sidebar, Header, BottomNav를 통합한 반응형 레이아웃입니다.
 * Desktop: Sidebar(244px) + Main Content
 * Tablet: Sidebar(72px) + Main Content
 * Mobile: Header + Main Content + BottomNav
 * 
 * 이 레이아웃은 로그인된 사용자만 접근 가능합니다.
 * 비로그인 사용자는 middleware에서 로그인 페이지로 리다이렉트됩니다.
 *
 * @see docs/PRD.md
 */

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--instagram-background)]">
      {/* Sidebar: Desktop/Tablet만 표시 */}
      <Sidebar />

      {/* Header: Mobile만 표시 */}
      <Header />

      {/* Main Content */}
      <main className="md:ml-[72px] lg:ml-[244px] pt-[60px] md:pt-0 pb-[50px] md:pb-0">
        {/* Main Feed 영역: 최대 630px, 중앙 정렬 */}
        <div className="max-w-[630px] mx-auto px-0 md:px-4">
          {children}
        </div>
      </main>

      {/* BottomNav: Mobile만 표시 */}
      <BottomNav />
    </div>
  );
}

