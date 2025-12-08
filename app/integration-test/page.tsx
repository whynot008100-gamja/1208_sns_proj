/**
 * @file integration-test/page.tsx
 * @description Clerk + Supabase 통합 테스트 페이지
 *
 * 이 페이지는 Clerk와 Supabase의 네이티브 통합이 올바르게 작동하는지 테스트합니다.
 *
 * 주요 테스트 항목:
 * 1. Clerk 인증 상태 확인
 * 2. Supabase 클라이언트 생성 및 토큰 주입 확인
 * 3. 데이터 조회/생성 테스트
 * 4. RLS 정책 작동 확인
 *
 * @dependencies
 * - @clerk/nextjs: Clerk 인증
 * - @supabase/supabase-js: Supabase 클라이언트
 */

"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/utils/supabase/clerk-client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function IntegrationTestPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const supabase = useClerkSupabaseClient();

  const [token, setToken] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskName, setTaskName] = useState("");

  // Clerk 세션 토큰 가져오기
  useEffect(() => {
    async function fetchToken() {
      if (isSignedIn) {
        const tokenValue = await getToken();
        setToken(tokenValue);
      }
    }
    fetchToken();
  }, [isSignedIn, getToken]);

  // tasks 조회
  async function loadTasks() {
    if (!isSignedIn) {
      setError("로그인이 필요합니다.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (supabaseError) {
        setError(`Supabase 오류: ${supabaseError.message}`);
        console.error("Supabase error:", supabaseError);
        return;
      }

      setTasks(data || []);
    } catch (err) {
      setError(`예상치 못한 오류: ${err instanceof Error ? err.message : String(err)}`);
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  }

  // task 생성
  async function createTask(e: React.FormEvent) {
    e.preventDefault();

    if (!isSignedIn) {
      setError("로그인이 필요합니다.");
      return;
    }

    if (!taskName.trim()) {
      setError("작업 이름을 입력하세요.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Clerk user ID 가져오기
      const clerkUserId = user?.id;
      if (!clerkUserId) {
        setError("Clerk 사용자 ID를 가져올 수 없습니다.");
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from("tasks")
        .insert({
          name: taskName.trim(),
          user_id: clerkUserId, // Clerk user ID 저장
        })
        .select()
        .single();

      if (supabaseError) {
        setError(`Supabase 오류: ${supabaseError.message}`);
        console.error("Supabase error:", supabaseError);
        return;
      }

      // 성공 시 목록 새로고침
      setTaskName("");
      await loadTasks();
    } catch (err) {
      setError(`예상치 못한 오류: ${err instanceof Error ? err.message : String(err)}`);
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!isLoaded) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">통합 테스트</h1>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">통합 테스트</h1>
        <p className="text-muted-foreground mb-4">
          이 페이지를 사용하려면 로그인이 필요합니다.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Clerk + Supabase 통합 테스트</h1>

      {/* 인증 정보 */}
      <section className="mb-8 p-4 bg-muted rounded-lg">
        <h2 className="text-xl font-semibold mb-4">인증 정보</h2>
        <div className="space-y-2 text-sm">
          <p>
            <strong>사용자 ID:</strong> {user?.id}
          </p>
          <p>
            <strong>이름:</strong> {user?.fullName || "없음"}
          </p>
          <p>
            <strong>이메일:</strong> {user?.emailAddresses[0]?.emailAddress || "없음"}
          </p>
          <p>
            <strong>Clerk 토큰:</strong>{" "}
            {token ? (
              <span className="text-green-600">✓ 설정됨</span>
            ) : (
              <span className="text-red-600">✗ 없음</span>
            )}
          </p>
          {token && (
            <details className="mt-2">
              <summary className="cursor-pointer text-blue-600 hover:underline">
                토큰 미리보기 (처음 50자)
              </summary>
              <code className="block mt-2 p-2 bg-background rounded text-xs break-all">
                {token.substring(0, 50)}...
              </code>
            </details>
          )}
        </div>
      </section>

      {/* 오류 메시지 */}
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-destructive font-semibold">오류</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Tasks 관리 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Tasks 관리</h2>

        {/* Task 생성 폼 */}
        <form onSubmit={createTask} className="mb-6">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="새 작업 이름 입력..."
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              {loading ? "생성 중..." : "생성"}
            </Button>
          </div>
        </form>

        {/* Tasks 목록 */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Tasks 목록</h3>
            <Button onClick={loadTasks} disabled={loading} variant="outline" size="sm">
              {loading ? "로딩 중..." : "새로고침"}
            </Button>
          </div>

          {loading && tasks.length === 0 ? (
            <p className="text-muted-foreground">로딩 중...</p>
          ) : tasks.length === 0 ? (
            <p className="text-muted-foreground">작업이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="p-3 bg-muted rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{task.name}</p>
                    <p className="text-xs text-muted-foreground">
                      생성일: {new Date(task.created_at).toLocaleString("ko-KR")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      User ID: {task.user_id}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 테스트 안내 */}
      <section className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">테스트 방법</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
          <li>위의 &quot;인증 정보&quot; 섹션에서 Clerk 토큰이 설정되었는지 확인</li>
          <li>새 작업을 생성하여 Supabase에 데이터가 저장되는지 확인</li>
          <li>작업 목록을 새로고침하여 자신의 작업만 조회되는지 확인 (RLS 정책 작동 확인)</li>
          <li>브라우저 개발자 도구 &gt; Network 탭에서 Supabase 요청의 Authorization 헤더 확인</li>
        </ol>
      </section>
    </div>
  );
}

