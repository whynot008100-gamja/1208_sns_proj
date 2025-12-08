/**
 * @file middleware.ts
 * @description Next.js Middleware
 *
 * Clerk 인증과 Supabase 세션 갱신을 처리합니다.
 * Supabase 공식 가이드에 따른 표준 구조를 따릅니다.
 *
 * @see https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
 */

import { clerkMiddleware } from "@clerk/nextjs/server";
import { updateSession } from "@/utils/supabase/middleware";
import { type NextRequest } from "next/server";

/**
 * Middleware 함수
 *
 * Clerk 인증을 처리하고 Supabase 세션을 갱신합니다.
 */
export default clerkMiddleware(async (auth, request: NextRequest) => {
  // Supabase 세션 갱신
  // Server Components에서 세션을 사용할 수 있도록 쿠키를 업데이트합니다.
  return await updateSession(request);
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
