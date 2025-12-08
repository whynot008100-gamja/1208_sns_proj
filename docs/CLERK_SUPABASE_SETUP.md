# Clerk + Supabase 통합 설정 가이드

이 문서는 Clerk와 Supabase를 네이티브 통합 방식으로 설정하는 방법을 안내합니다.

> **중요**: 2025년 4월 1일부터 JWT 템플릿 방식은 deprecated되었습니다. 이 가이드는 네이티브 통합 방식을 사용합니다.

## 1. Clerk Dashboard 설정

### 1.1 Supabase 통합 활성화

1. [Clerk Dashboard](https://dashboard.clerk.com)에 로그인
2. **Integrations** > **Supabase** 메뉴로 이동
3. 또는 직접 [Supabase integration setup](https://dashboard.clerk.com/setup/supabase) 페이지로 이동
4. **Activate Supabase integration** 버튼 클릭
5. 표시되는 **Clerk domain**을 복사 (예: `your-app.clerk.accounts.dev`)

### 1.2 Clerk 세션 토큰에 role 클레임 추가

네이티브 통합을 사용하면 Clerk가 자동으로 세션 토큰에 `"role": "authenticated"` 클레임을 추가합니다. 별도 설정이 필요 없습니다.

## 2. Supabase Dashboard 설정

### 2.1 Clerk를 Third-Party Auth Provider로 추가

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. **Authentication** > **Providers** 메뉴로 이동
4. **Add provider** 버튼 클릭
5. **Clerk** 선택
6. Clerk Dashboard에서 복사한 **Clerk domain** 입력
7. **Save** 클릭

### 2.2 로컬 개발 환경 설정 (선택사항)

로컬 Supabase를 사용하는 경우, `supabase/config.toml` 파일에 다음 설정을 추가:

```toml
[auth.third_party.clerk]
enabled = true
domain = "your-app.clerk.accounts.dev"
```

## 3. 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 설정하세요:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 환경 변수 확인 방법

- **Clerk Keys**: [Clerk Dashboard > API Keys](https://dashboard.clerk.com/last-active?path=api-keys)
- **Supabase Keys**: [Supabase Dashboard > Project Settings > API](https://supabase.com/dashboard/project/_/settings/api)

## 4. 코드에서 사용하기

### 4.1 Client Component에서 사용

```tsx
'use client';

import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';

export default function MyComponent() {
  const supabase = useClerkSupabaseClient();

  async function fetchData() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*');
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    return data;
  }

  return <div>...</div>;
}
```

### 4.2 Server Component에서 사용

```tsx
import { createClerkSupabaseClient } from '@/lib/supabase/server';

export default async function MyPage() {
  const supabase = createClerkSupabaseClient();
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*');
  
  if (error) {
    throw error;
  }
  
  return <div>{/* ... */}</div>;
}
```

### 4.3 Server Action에서 사용

```ts
'use server';

import { createClerkSupabaseClient } from '@/lib/supabase/server';

export async function createTask(name: string) {
  const supabase = createClerkSupabaseClient();
  
  const { data, error } = await supabase
    .from('tasks')
    .insert({ name });
  
  if (error) {
    throw new Error('Failed to create task');
  }
  
  return data;
}
```

## 5. RLS (Row Level Security) 정책

Supabase에서 데이터 접근을 제어하려면 RLS 정책을 설정해야 합니다. RLS 정책은 `auth.jwt()->>'sub'`를 사용하여 Clerk 사용자 ID를 확인합니다.

### 5.1 RLS 정책 예시

```sql
-- 사용자는 자신의 데이터만 조회 가능
CREATE POLICY "Users can view their own tasks"
ON "public"."tasks"
FOR SELECT
TO authenticated
USING (
  (SELECT auth.jwt()->>'sub') = user_id::text
);

-- 사용자는 자신의 데이터만 생성 가능
CREATE POLICY "Users can insert their own tasks"
ON "public"."tasks"
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.jwt()->>'sub') = user_id::text
);

-- 사용자는 자신의 데이터만 수정 가능
CREATE POLICY "Users can update their own tasks"
ON "public"."tasks"
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.jwt()->>'sub') = user_id::text
)
WITH CHECK (
  (SELECT auth.jwt()->>'sub') = user_id::text
);

-- 사용자는 자신의 데이터만 삭제 가능
CREATE POLICY "Users can delete their own tasks"
ON "public"."tasks"
FOR DELETE
TO authenticated
USING (
  (SELECT auth.jwt()->>'sub') = user_id::text
);
```

### 5.2 테이블에 user_id 컬럼 추가

RLS 정책을 사용하려면 테이블에 Clerk user ID를 저장하는 컬럼이 필요합니다:

```sql
-- user_id 컬럼 추가 (Clerk user ID 저장)
ALTER TABLE tasks 
ADD COLUMN user_id TEXT NOT NULL DEFAULT (SELECT auth.jwt()->>'sub');

-- 또는 테이블 생성 시
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT (SELECT auth.jwt()->>'sub'),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 6. 통합 확인

### 6.1 통합 상태 확인

1. Clerk에 로그인
2. Supabase 클라이언트로 데이터 조회/생성 시도
3. 브라우저 개발자 도구 > Network 탭에서 요청 헤더 확인
   - `Authorization: Bearer <clerk-session-token>` 헤더가 포함되어야 함

### 6.2 문제 해결

**문제**: Supabase 요청이 401 Unauthorized 에러 발생

**해결 방법**:
1. Clerk Dashboard에서 Supabase 통합이 활성화되었는지 확인
2. Supabase Dashboard에서 Clerk provider가 추가되었는지 확인
3. 환경 변수가 올바르게 설정되었는지 확인
4. Clerk 세션 토큰이 유효한지 확인 (`useAuth().getToken()`)

**문제**: RLS 정책이 작동하지 않음

**해결 방법**:
1. RLS가 활성화되었는지 확인: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. 정책이 올바르게 생성되었는지 확인
3. `auth.jwt()->>'sub'`가 올바른 Clerk user ID를 반환하는지 확인
4. 개발 환경에서는 RLS를 비활성화할 수 있음 (프로덕션에서는 필수)

## 7. 참고 자료

- [Clerk Supabase 통합 공식 문서](https://clerk.com/docs/guides/development/integrations/databases/supabase)
- [Supabase Third-Party Auth 문서](https://supabase.com/docs/guides/auth/third-party/clerk)
- [Supabase RLS 가이드](https://supabase.com/docs/guides/auth/row-level-security)

## 8. 주요 변경 사항 (2025년 4월 이후)

- ✅ **네이티브 통합 사용**: JWT 템플릿 불필요
- ✅ **자동 role 클레임**: Clerk가 자동으로 `"role": "authenticated"` 추가
- ✅ **간편한 설정**: Clerk Dashboard에서 한 번만 설정
- ❌ **JWT 템플릿 deprecated**: 더 이상 사용하지 않음

