/**
 * @file utils/supabase/server.ts
 * @description Supabase 클라이언트 (Server Component/Server Action용)
 *
 * Supabase 공식 가이드에 따른 표준 구조
 * Cookie-based auth를 사용하여 세션을 관리합니다.
 *
 * @see https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 서버에서 사용할 Supabase 클라이언트 생성
 *
 * Server Component, Server Action, Route Handler에서 사용합니다.
 * Cookie를 사용하여 세션을 관리합니다.
 *
 * @example
 * ```tsx
 * // Server Component
 * import { createClient } from '@/utils/supabase/server';
 *
 * export default async function MyPage() {
 *   const supabase = await createClient();
 *   const { data } = await supabase.from('table').select('*');
 *   return <div>...</div>;
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

