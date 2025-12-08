/**
 * @file app/(main)/layout.tsx
 * @description Instagram Clone 메인 레이아웃
 *
 * Sidebar, Header, BottomNav를 통합한 반응형 레이아웃입니다.
 * Desktop: Sidebar(244px) + Main Content
 * Tablet: Sidebar(72px) + Main Content
 * Mobile: Header + Main Content + BottomNav
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
      <main className="md:ml-[72px] lg:ml-[244px] pt-0 lg:pt-0 pb-[50px] lg:pb-0">
        {/* Main Feed 영역: 최대 630px, 중앙 정렬 */}
        <div className="max-w-[630px] mx-auto">
          {children}
        </div>
      </main>

      {/* BottomNav: Mobile만 표시 */}
      <BottomNav />
    </div>
  );
}

