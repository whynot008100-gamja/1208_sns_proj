/**
 * @file components/search/SearchInput.tsx
 * @description 검색 입력창 컴포넌트
 *
 * 실시간 검색을 위한 입력창입니다.
 * debounce를 사용하여 불필요한 API 호출을 방지합니다.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "검색...",
  className,
  debounceMs = 300,
}: SearchInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // debounce를 사용한 onChange 핸들러
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onChange(inputValue);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputValue, onChange, debounceMs]);

  // 외부에서 value가 변경되면 inputValue도 업데이트
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleClear = useCallback(() => {
    setInputValue("");
    onChange("");
  }, [onChange]);

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--instagram-text-secondary)]" />
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10 h-10 bg-[var(--instagram-background)] border-[var(--instagram-border)] focus:border-[var(--instagram-blue)]"
        aria-label="검색어 입력"
      />
      {inputValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--instagram-background)] transition-colors"
          aria-label="검색어 지우기"
        >
          <X className="w-4 h-4 text-[var(--instagram-text-secondary)]" />
        </button>
      )}
    </div>
  );
}

