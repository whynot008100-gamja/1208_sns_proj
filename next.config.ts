import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" },
      { hostname: "*.supabase.co" }, // Supabase Storage
    ],
  },
  // Next.js 15 App Router body size limit 설정
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // 50MB 제한
    },
  },
  // API Routes body size limit 설정 (Next.js 15)
  // 참고: App Router의 Route Handlers는 기본적으로 큰 body를 지원하지만,
  // 명시적으로 설정하여 안정성을 높입니다.
};

export default nextConfig;
