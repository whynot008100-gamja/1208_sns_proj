/**
 * @file utils/supabase/client.ts
 * @description Supabase 클라이언트 (Client Component용)
 *
 * Supabase 공식 가이드에 따른 표준 구조
 * Clerk와 통합된 경우 Clerk 토큰을 사용합니다.
 *
 * @see https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
 */

import { createBrowserClient } from "@supabase/ssr";

/**
 * 브라우저에서 사용할 Supabase 클라이언트 생성
 *
 * Client Component에서 사용합니다.
 * Clerk와 통합된 경우, Clerk 세션 토큰이 자동으로 주입됩니다.
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { createClient } from '@/utils/supabase/client';
 *
 * export default function MyComponent() {
 *   const supabase = createClient();
 *   const { data } = await supabase.from('table').select('*');
 *   return <div>...</div>;
 * }
 * ```
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

