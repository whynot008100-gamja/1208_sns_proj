/**
 * @file supabase-test/page.tsx
 * @description Supabase 표준 구조 테스트 페이지
 *
 * Supabase 공식 가이드에 따른 표준 클라이언트 사용을 테스트합니다.
 * Cookie-based auth를 사용합니다.
 *
 * @see https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
 */

import { createClient } from "@/utils/supabase/server";
import { Suspense } from "react";

async function SupabaseData() {
  const supabase = await createClient();
  const { data: instruments, error } = await supabase
    .from("instruments")
    .select("*");

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 font-semibold">오류 발생</p>
        <p className="text-sm text-red-600">{error.message}</p>
      </div>
    );
  }

  if (!instruments || instruments.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">데이터가 없습니다.</p>
        <p className="text-sm text-yellow-600 mt-2">
          Supabase Dashboard의 SQL Editor에서 다음 쿼리를 실행하세요:
        </p>
        <pre className="mt-2 p-2 bg-yellow-100 rounded text-xs overflow-x-auto">
          {`-- Create the table
create table instruments (
  id bigint primary key generated always as identity,
  name text not null
);

-- Insert some sample data
insert into instruments (name)
values
  ('violin'),
  ('viola'),
  ('cello');

-- Make the data publicly readable
alter table instruments enable row level security;

create policy "public can read instruments"
on public.instruments
for select
to anon
using (true);`}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold mb-4">Instruments 목록</h3>
      <ul className="space-y-2">
        {instruments.map((instrument: any) => (
          <li
            key={instrument.id}
            className="p-3 bg-muted rounded-lg border border-border"
          >
            <p className="font-medium">{instrument.name}</p>
            <p className="text-xs text-muted-foreground">ID: {instrument.id}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SupabaseTestPage() {
  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Supabase 표준 구조 테스트</h1>

      <section className="mb-8 p-4 bg-muted rounded-lg">
        <h2 className="text-xl font-semibold mb-4">테스트 설명</h2>
        <p className="text-sm text-muted-foreground mb-4">
          이 페이지는 Supabase 공식 가이드에 따른 표준 클라이언트를 사용합니다.
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>
            <code className="bg-background px-1 rounded">utils/supabase/server.ts</code>{" "}
            사용 (Server Component)
          </li>
          <li>Cookie-based auth 사용</li>
          <li>Middleware에서 세션 자동 갱신</li>
        </ul>
      </section>

      <Suspense fallback={<div>로딩 중...</div>}>
        <SupabaseData />
      </Suspense>

      <section className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">참고 자료</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>
            <a
              href="https://supabase.com/docs/guides/getting-started/quickstarts/nextjs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Supabase Next.js Quickstart
            </a>
          </li>
          <li>
            <a
              href="/docs/SUPABASE_MIGRATION.md"
              className="text-blue-600 hover:underline"
            >
              마이그레이션 가이드
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}

