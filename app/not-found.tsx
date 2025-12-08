/**
 * @file app/not-found.tsx
 * @description 404 페이지
 *
 * 존재하지 않는 페이지에 접근했을 때 표시되는 페이지입니다.
 */

import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAFA] px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#262626] mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-[#262626] mb-2">
          페이지를 찾을 수 없습니다
        </h2>
        <p className="text-[#8e8e8e] mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <Link href="/">
          <Button className="bg-[#0095f6] hover:bg-[#0085e5] text-white">
            <Home className="mr-2 h-4 w-4" />
            홈으로 돌아가기
          </Button>
        </Link>
      </div>
    </div>
  );
}

