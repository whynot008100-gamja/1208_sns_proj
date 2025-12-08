/**
 * @file env.ts
 * @description 환경 변수 검증 및 타입 안전한 접근
 *
 * 이 파일은 환경 변수를 검증하고 타입 안전하게 접근할 수 있도록 합니다.
 * 필수 환경 변수가 없으면 개발 시점에 명확한 오류 메시지를 제공합니다.
 */

/**
 * 환경 변수 검증 결과
 */
interface EnvValidation {
  isValid: boolean;
  missing: string[];
  errors: string[];
}

/**
 * 환경 변수 검증
 * @returns 검증 결과
 */
export function validateEnv(): EnvValidation {
  const required = {
    // Clerk
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  const missing: string[] = [];
  const errors: string[] = [];

  // 필수 환경 변수 확인
  for (const [key, value] of Object.entries(required)) {
    if (!value || value.trim() === "") {
      missing.push(key);
    }
  }

  // Clerk 키 형식 검증
  if (
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_")
  ) {
    errors.push(
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY는 'pk_'로 시작해야 합니다."
    );
  }

  if (
    process.env.CLERK_SECRET_KEY &&
    !process.env.CLERK_SECRET_KEY.startsWith("sk_")
  ) {
    errors.push("CLERK_SECRET_KEY는 'sk_'로 시작해야 합니다.");
  }

  // Supabase URL 형식 검증
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("https://")
  ) {
    errors.push(
      "NEXT_PUBLIC_SUPABASE_URL는 'https://'로 시작해야 합니다."
    );
  }

  return {
    isValid: missing.length === 0 && errors.length === 0,
    missing,
    errors,
  };
}

/**
 * 환경 변수 검증 및 오류 메시지 출력
 * 개발 환경에서만 실행됩니다.
 */
export function checkEnv(): void {
  if (process.env.NODE_ENV === "production") {
    return; // 프로덕션에서는 검증하지 않음
  }

  const validation = validateEnv();

  if (!validation.isValid) {
    console.error("❌ 환경 변수 검증 실패\n");

    if (validation.missing.length > 0) {
      console.error("누락된 환경 변수:");
      validation.missing.forEach((key) => {
        console.error(`  - ${key}`);
      });
      console.error("");
    }

    if (validation.errors.length > 0) {
      console.error("환경 변수 형식 오류:");
      validation.errors.forEach((error) => {
        console.error(`  - ${error}`);
      });
      console.error("");
    }

    console.error(
      "💡 해결 방법: .env 파일을 생성하고 필요한 환경 변수를 설정하세요."
    );
    console.error(
      "   자세한 내용은 docs/CLERK_SUPABASE_SETUP.md를 참고하세요.\n"
    );
  } else {
    console.log("✅ 환경 변수 검증 성공");
  }
}

/**
 * 타입 안전한 환경 변수 접근
 * 서버 사이드에서만 사용하세요.
 */
export const env = {
  // Clerk
  clerk: {
    publishableKey:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
      (() => {
        throw new Error("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required");
      })(),
    secretKey:
      process.env.CLERK_SECRET_KEY ||
      (() => {
        throw new Error("CLERK_SECRET_KEY is required");
      })(),
  },
  // Supabase
  supabase: {
    url:
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      (() => {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
      })(),
    anonKey:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      (() => {
        throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is required");
      })(),
    serviceRoleKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      (() => {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
      })(),
    storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET || "uploads",
  },
} as const;

