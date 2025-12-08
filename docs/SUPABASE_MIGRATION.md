# Supabase 표준 구조 마이그레이션 가이드

이 문서는 Supabase 공식 Next.js 가이드에 따라 프로젝트를 표준 구조로 마이그레이션한 내용을 설명합니다.

## 변경 사항

### 1. 디렉토리 구조 변경

**이전 구조:**
```
lib/supabase/
  ├── clerk-client.ts
  ├── server.ts
  ├── client.ts
  └── service-role.ts
```

**새 구조 (Supabase 공식 가이드):**
```
utils/supabase/
  ├── client.ts          # Client Component용 (표준)
  ├── server.ts          # Server Component용 (표준, cookie-based)
  ├── middleware.ts      # Middleware 세션 갱신 (표준)
  ├── clerk-client.ts    # Clerk 통합 (Client Component용)
  ├── clerk-server.ts    # Clerk 통합 (Server Component용)
  └── service-role.ts     # Service Role 클라이언트
```

### 2. 패키지 추가

- `@supabase/ssr`: Supabase Server-Side Rendering 지원 패키지 추가

### 3. Middleware 업데이트

Middleware에 Supabase 세션 갱신 로직이 추가되었습니다:

```typescript
// middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";
import { updateSession } from "@/utils/supabase/middleware";

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // Supabase 세션 갱신
  return await updateSession(request);
});
```

### 4. Import 경로 변경

모든 Supabase 클라이언트 import 경로가 변경되었습니다:

**이전:**
```typescript
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
```

**새 경로:**
```typescript
import { useClerkSupabaseClient } from "@/utils/supabase/clerk-client";
import { createClerkSupabaseClient } from "@/utils/supabase/clerk-server";
import { getServiceRoleClient } from "@/utils/supabase/service-role";
```

## 사용 방법

### Client Component (Clerk 통합)

```tsx
'use client';

import { useClerkSupabaseClient } from '@/utils/supabase/clerk-client';

export default function MyComponent() {
  const supabase = useClerkSupabaseClient();
  // Clerk 토큰이 자동으로 주입됩니다
}
```

### Server Component (Clerk 통합)

```tsx
import { createClerkSupabaseClient } from '@/utils/supabase/clerk-server';

export default async function MyPage() {
  const supabase = createClerkSupabaseClient();
  // Clerk 토큰이 자동으로 주입됩니다
}
```

### Server Component (표준 Supabase Auth)

```tsx
import { createClient } from '@/utils/supabase/server';

export default async function MyPage() {
  const supabase = await createClient();
  // Cookie-based auth 사용
}
```

### Client Component (표준 Supabase Auth)

```tsx
'use client';

import { createClient } from '@/utils/supabase/client';

export default function MyComponent() {
  const supabase = createClient();
  // Cookie-based auth 사용
}
```

## 주요 특징

### 1. Cookie-based Auth (표준)

Supabase 공식 가이드에 따라 cookie-based auth를 사용합니다:
- `utils/supabase/client.ts`: `createBrowserClient` 사용
- `utils/supabase/server.ts`: `createServerClient` 사용 (cookies)
- `utils/supabase/middleware.ts`: 세션 갱신 로직

### 2. Clerk 통합 유지

Clerk와 Supabase의 네이티브 통합을 계속 사용할 수 있습니다:
- `utils/supabase/clerk-client.ts`: Client Component용
- `utils/supabase/clerk-server.ts`: Server Component용

### 3. Middleware 세션 갱신

Middleware에서 Supabase 세션을 자동으로 갱신하여 Server Components에서 사용할 수 있도록 합니다.

## 마이그레이션 체크리스트

- [x] `@supabase/ssr` 패키지 설치
- [x] `utils/supabase/` 디렉토리 구조 생성
- [x] 표준 클라이언트 파일 생성 (`client.ts`, `server.ts`, `middleware.ts`)
- [x] Clerk 통합 클라이언트 마이그레이션
- [x] Service Role 클라이언트 마이그레이션
- [x] Middleware 업데이트
- [x] 모든 import 경로 업데이트
- [ ] 기존 `lib/supabase/` 파일 제거 (선택사항)

## 참고 자료

- [Supabase Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Server-Side Auth Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Clerk Supabase Integration](https://clerk.com/docs/guides/development/integrations/databases/supabase)

