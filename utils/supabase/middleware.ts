/**
 * @file utils/supabase/middleware.ts
 * @description Supabase Middleware 세션 갱신 로직
 *
 * Supabase 공식 가이드에 따른 표준 구조
 * Middleware에서 세션을 갱신하여 Server Components에서 사용할 수 있도록 합니다.
 *
 * @see https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase 세션 갱신
 *
 * Middleware에서 호출하여 세션을 갱신하고 쿠키를 업데이트합니다.
 * Server Components에서 세션을 사용할 수 있도록 합니다.
 *
 * @param request Next.js 요청 객체
 * @returns NextResponse 객체 (업데이트된 쿠키 포함)
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: Don't remove getUser()
  // This refreshes the auth token if it's expired
  await supabase.auth.getUser();

  return supabaseResponse;
}

