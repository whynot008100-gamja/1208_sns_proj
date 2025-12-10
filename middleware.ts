/**
 * @file middleware.ts
 * @description Next.js Middleware
 *
 * Clerk 인증과 Supabase 세션 갱신을 처리합니다.
 * 비로그인 사용자는 로그인 페이지로, 로그인 사용자는 메인 페이지로 리다이렉트합니다.
 * Supabase 공식 가이드에 따른 표준 구조를 따릅니다.
 *
 * @see https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { updateSession } from "@/utils/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";

// 공개 라우트 (인증 불필요)
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/sync-user",
]);

/**
 * Middleware 함수
 *
 * Clerk 인증을 처리하고 Supabase 세션을 갱신합니다.
 * 인증 상태에 따라 적절한 페이지로 리다이렉트합니다.
 */
export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { userId } = await auth();
  const { pathname } = request.nextUrl;
  const isPublic = isPublicRoute(request);

  // Supabase 세션 갱신
  let response = await updateSession(request);

  // 비로그인 상태에서 메인 페이지 접근 시 로그인 페이지로 리다이렉트
  if (!userId && !isPublic && pathname !== "/") {
    const signInUrl = new URL("/sign-in", request.url);
    return NextResponse.redirect(signInUrl);
  }

  // 비로그인 상태에서 루트 경로 접근 시 로그인 페이지로 리다이렉트
  if (!userId && pathname === "/") {
    const signInUrl = new URL("/sign-in", request.url);
    return NextResponse.redirect(signInUrl);
  }

  // 로그인 상태에서 로그인/회원가입 페이지 접근 시 메인 페이지로 리다이렉트
  if (userId && (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up"))) {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return response;
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
