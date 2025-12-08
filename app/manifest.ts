/**
 * @file app/manifest.ts
 * @description PWA 매니페스트 파일
 *
 * Progressive Web App을 위한 매니페스트를 생성합니다.
 */

import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mini Instagram",
    short_name: "Instagram",
    description: "Instagram 스타일 SNS 애플리케이션",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFAFA",
    theme_color: "#0095f6",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-256x256.png",
        sizes: "256x256",
        type: "image/png",
      },
      {
        src: "/icons/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

