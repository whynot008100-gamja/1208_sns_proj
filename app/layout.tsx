/**
 * @file app/layout.tsx
 * @description Root Layout with Clerk Provider
 *
 * Clerk 한국어 로컬라이제이션을 적용한 루트 레이아웃입니다.
 * Tailwind CSS v4 호환성을 위해 appearance prop을 사용합니다.
 *
 * @see https://clerk.com/docs/guides/customizing-clerk/localization
 */

import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";

import { SyncUserProvider } from "@/components/providers/sync-user-provider";
import { customKoKR } from "@/lib/clerk/localization";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: "Mini Instagram - 바이브 코딩 SNS",
  description: "Instagram 스타일 SNS 애플리케이션",
  keywords: ["Instagram", "SNS", "소셜 네트워크", "사진 공유"],
  authors: [{ name: "바이브 코딩" }],
  openGraph: {
    title: "Mini Instagram",
    description: "Instagram 스타일 SNS 애플리케이션",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mini Instagram",
    description: "Instagram 스타일 SNS 애플리케이션",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        cssLayerName: "clerk", // Tailwind CSS v4 호환성
      }}
      localization={customKoKR}
    >
      <html lang="ko">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <SyncUserProvider>{children}</SyncUserProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
