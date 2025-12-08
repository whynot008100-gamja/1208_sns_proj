/**
 * @file components/post/CreatePostModal.tsx
 * @description 게시물 작성 모달 컴포넌트
 *
 * Instagram 스타일의 게시물 작성 모달입니다.
 * 이미지 업로드 및 캡션 입력 기능을 제공합니다.
 *
 * 주요 기능:
 * 1. 이미지 파일 선택 및 미리보기
 * 2. 캡션 입력 (최대 2,200자)
 * 3. Supabase Storage에 이미지 업로드
 * 4. posts 테이블에 게시물 데이터 저장
 *
 * @see docs/PRD.md
 */

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Upload, Loader2 } from "lucide-react";
import { validateImageFile } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const MAX_CAPTION_LENGTH = 2200;

export default function CreatePostModal({
  open,
  onOpenChange,
  onSuccess,
}: CreatePostModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // 파일 검증
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || "파일 선택에 실패했습니다.");
        return;
      }

      setSelectedFile(file);
      setError(null);

      // 미리보기 URL 생성
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    },
    []
  );

  // 파일 선택 버튼 클릭
  const handleSelectFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 이미지 제거
  const handleRemoveImage = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [previewUrl]);

  // 업로드 핸들러
  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      setError("이미지를 선택해주세요.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // FormData 생성
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("caption", caption);

      // API 호출
      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "게시물 업로드에 실패했습니다."
        );
      }

      // 성공 처리
      const data = await response.json();

      // 상태 초기화
      handleRemoveImage();
      setCaption("");
      setUploading(false);

      // 모달 닫기
      onOpenChange(false);

      // 성공 콜백 호출
      onSuccess?.();

      // 피드 새로고침 (간단하게 페이지 새로고침)
      // TODO: 더 나은 방법은 Context나 전역 상태를 사용하는 것
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (err) {
      console.error("Upload error:", err);
      let errorMessage = "게시물 업로드에 실패했습니다. 다시 시도해주세요.";
      
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        errorMessage = "인터넷 연결을 확인해주세요.";
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setUploading(false);
    }
  }, [selectedFile, caption, onOpenChange, onSuccess, handleRemoveImage]);

  // 모달 닫기 핸들러
  const handleClose = useCallback(() => {
    if (uploading) return; // 업로드 중에는 닫기 불가

    handleRemoveImage();
    setCaption("");
    setError(null);
    onOpenChange(false);
  }, [uploading, handleRemoveImage, onOpenChange]);

  // 컴포넌트 언마운트 시 미리보기 URL 정리
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-[var(--instagram-border)]">
          <DialogTitle className="text-center text-lg font-semibold">
            새 게시물 만들기
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col">
          {/* 이미지 선택 영역 */}
          {!previewUrl ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="w-12 h-12 text-[var(--instagram-text-secondary)] mb-4" />
              <p className="text-lg font-semibold mb-2 text-[var(--instagram-text-primary)]">
                사진과 동영상을 여기에 끌어다 놓으세요
              </p>
              <Button
                onClick={handleSelectFile}
                variant="default"
                className="bg-[var(--instagram-blue)] hover:bg-[var(--instagram-blue)]/90 text-white"
              >
                컴퓨터에서 선택
              </Button>
            </div>
          ) : (
            <div className="relative">
              {/* 이미지 미리보기 */}
              <div className="relative w-full aspect-square bg-black">
                <Image
                  src={previewUrl}
                  alt="미리보기"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 600px"
                />
              </div>

              {/* 이미지 제거 버튼 */}
              <button
                onClick={handleRemoveImage}
                className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                aria-label="이미지 제거"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* 캡션 입력 영역 */}
          {previewUrl && (
            <div className="px-6 py-4 border-t border-[var(--instagram-border)]">
              <div className="space-y-2">
                <Textarea
                  placeholder="캡션을 입력하세요..."
                  value={caption}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= MAX_CAPTION_LENGTH) {
                      setCaption(value);
                    }
                  }}
                  className="min-h-[100px] resize-none"
                  maxLength={MAX_CAPTION_LENGTH}
                />
                <div className="flex justify-end">
                  <span
                    className={cn(
                      "text-xs text-[var(--instagram-text-secondary)]",
                      caption.length >= MAX_CAPTION_LENGTH &&
                        "text-red-500"
                    )}
                  >
                    {caption.length} / {MAX_CAPTION_LENGTH}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="px-6 py-3 bg-red-50 border-t border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 업로드 버튼 */}
          {previewUrl && (
            <div className="px-6 py-4 border-t border-[var(--instagram-border)] flex justify-end">
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-[var(--instagram-blue)] hover:bg-[var(--instagram-blue)]/90 text-white disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    업로드 중...
                  </>
                ) : (
                  "공유하기"
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

