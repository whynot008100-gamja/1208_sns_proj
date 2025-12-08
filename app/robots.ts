/**
 * @file app/robots.ts
 * @description robots.txt 생성
 *
 * 검색 엔진 크롤러를 위한 robots.txt 파일을 동적으로 생성합니다.
 */

import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth-test/", "/integration-test/", "/storage-test/", "/supabase-test/"],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"}/sitemap.xml`,
  };
}

