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
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Upload, Loader2 } from "lucide-react";
import { validateMediaFile } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";

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
  const supabase = useClerkSupabaseClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // 🔍 즉시 디버깅 정보 출력
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      console.group("🔍 파일 선택 디버깅");
      console.log("📁 파일 정보:", {
        이름: file.name,
        크기: `${fileSizeMB} MB`,
        크기_바이트: `${file.size.toLocaleString()} bytes`,
        타입: file.type,
        최대_제한: "50MB",
        상태: file.size > 50 * 1024 * 1024 ? "❌ 초과" : "✅ 허용",
      });
      console.log("🎬 미디어 타입:", file.type.startsWith("video/") ? "동영상" : "이미지");
      console.groupEnd();

      // 파일 크기 사전 검증 (즉시 피드백)
      if (file.size > 50 * 1024 * 1024) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        setError(`파일이 너무 큽니다. (${sizeMB}MB / 최대 50MB)`);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // 파일 검증
      const validation = validateMediaFile(file);
      if (!validation.valid) {
        console.error("❌ 파일 검증 실패:", validation.error);
        setError(validation.error || "파일 선택에 실패했습니다.");
        return;
      }

      // 파일 타입 확인 (이미지 또는 동영상)
      const isVideo = file.type.startsWith("video/");
      setMediaType(isVideo ? "video" : "image");
      setSelectedFile(file);
      setError(null);

      console.log("✅ 파일 검증 통과, 미리보기 생성 중...");

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

  // 미디어 제거
  const handleRemoveImage = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setMediaType(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [previewUrl]);

  // 업로드 핸들러
  // 클라이언트에서 직접 Supabase Storage에 업로드하여 Next.js API Routes의 body size limit 문제를 우회
  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      setError("파일을 선택해주세요.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      console.group("📤 게시물 업로드 시작");
      console.log("📁 파일 정보:", {
        이름: selectedFile.name,
        크기: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
        타입: selectedFile.type,
      });

      // 1. Supabase Storage에 파일 업로드 (클라이언트에서 직접)
      const fileExt = selectedFile.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;

      console.log("📤 Supabase Storage 업로드 중...", fileName);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("posts")
        .upload(fileName, selectedFile, {
          contentType: selectedFile.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError || !uploadData) {
        console.error("❌ Storage 업로드 실패:", uploadError);
        
        let errorMessage = "미디어 파일 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.";
        if (uploadError) {
          if (uploadError.message?.includes("file_size_limit")) {
            errorMessage = "파일 크기가 너무 큽니다. 50MB 이하의 파일만 업로드할 수 있습니다.";
          } else if (uploadError.message?.includes("allowed_mime_types")) {
            errorMessage = "지원하지 않는 파일 형식입니다.";
          } else {
            errorMessage = `업로드 실패: ${uploadError.message || "알 수 없는 오류"}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      console.log("✅ Storage 업로드 성공:", uploadData.path);

      // 2. Public URL 생성
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const imageUrl = `${supabaseUrl}/storage/v1/object/public/posts/${fileName}`;

      console.log("🔗 Public URL 생성:", imageUrl);

      // 3. API를 호출하여 posts 테이블에 메타데이터만 저장
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: imageUrl,
          title: title.trim() || null,
          caption: caption.trim() || null,
        }),
      });

      if (!response.ok) {
        // 업로드된 파일 삭제 시도
        try {
          await supabase.storage.from("posts").remove([fileName]);
          console.log("🗑️ 업로드 실패로 인한 파일 삭제 완료");
        } catch (removeError) {
          console.error("❌ 파일 삭제 실패:", removeError);
        }

        const responseText = await response.text();
        let errorData: any = {};
        
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { error: responseText || "알 수 없는 오류가 발생했습니다." };
        }
        
        const errorMessage = errorData.error || "게시물 저장에 실패했습니다.";
        console.error("❌ API 호출 실패:", {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
        });
        
        throw new Error(errorMessage);
      }

      // 성공 처리
      const data = await response.json();
      console.log("✅ 게시물 생성 성공:", data.id);
      console.groupEnd();

      // 상태 초기화
      handleRemoveImage();
      setTitle("");
      setCaption("");
      setUploading(false);

      // 모달 닫기
      onOpenChange(false);

      // 성공 콜백 호출
      onSuccess?.();

      // 피드 새로고침 (간단하게 페이지 새로고침)
      // 참고: 향후 개선 시 Context나 전역 상태를 사용하는 것을 고려
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (err) {
      console.error("❌ 업로드 에러:", err);
      let errorMessage = "게시물 업로드에 실패했습니다. 다시 시도해주세요.";
      
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        errorMessage = "인터넷 연결을 확인해주세요.";
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setUploading(false);
      console.groupEnd();
    }
  }, [selectedFile, title, caption, onOpenChange, onSuccess, handleRemoveImage, supabase]);

  // 모달 닫기 핸들러
  const handleClose = useCallback(() => {
    if (uploading) return; // 업로드 중에는 닫기 불가

    handleRemoveImage();
    setTitle("");
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
          <DialogDescription className="sr-only">
            이미지 또는 동영상을 선택하고 캡션을 입력하여 새 게시물을 작성하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col">
          {/* 이미지 선택 영역 */}
          {!previewUrl ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,video/x-msvideo"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="미디어 파일 선택"
              />
              <Upload className="w-12 h-12 text-[var(--instagram-text-secondary)] mb-4" />
              <p className="text-lg font-semibold mb-2 text-[var(--instagram-text-primary)]">
                사진과 동영상을 여기에 끌어다 놓으세요
              </p>
              <Button
                onClick={handleSelectFile}
                variant="default"
                className="bg-[var(--instagram-blue)] hover:bg-[var(--instagram-blue)]/90 text-white"
                aria-label="컴퓨터에서 미디어 파일 선택"
              >
                컴퓨터에서 선택
              </Button>
            </div>
          ) : (
            <div className="relative">
              {/* 미디어 미리보기 */}
              <div className="relative w-full bg-black flex items-center justify-center min-h-[400px] max-h-[600px]">
                {mediaType === "video" && previewUrl ? (
                  <video
                    src={previewUrl}
                    controls
                    muted
                    className="w-full h-auto max-h-[600px] object-contain"
                    preload="metadata"
                  />
                ) : (
                  <Image
                    src={previewUrl!}
                    alt="미리보기"
                    width={600}
                    height={600}
                    className="w-full h-auto max-h-[600px] object-contain"
                    sizes="(max-width: 768px) 100vw, 600px"
                  />
                )}
              </div>

              {/* 미디어 제거 버튼 */}
              <button
                onClick={handleRemoveImage}
                className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                aria-label="미디어 제거"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* 타이틀 입력 영역 */}
          {previewUrl && (
            <div className="px-6 py-4 border-t border-[var(--instagram-border)]">
              <div className="space-y-2">
                <Input
                  placeholder="제목을 입력하세요... (선택사항)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-base font-semibold"
                  aria-label="게시물 제목 입력"
                />
              </div>
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
                  aria-label="게시물 캡션 입력"
                  aria-describedby={error ? "caption-error" : "caption-length"}
                />
                <div className="flex justify-end">
                  <span
                    id="caption-length"
                    className={cn(
                      "text-xs text-[var(--instagram-text-secondary)]",
                      caption.length >= MAX_CAPTION_LENGTH &&
                        "text-red-500"
                    )}
                    aria-live="polite"
                  >
                    {caption.length} / {MAX_CAPTION_LENGTH}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="px-6 py-3 bg-red-50 border-t border-red-200" role="alert">
              <p id="caption-error" className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 업로드 버튼 */}
          {previewUrl && (
            <div className="px-6 py-4 border-t border-[var(--instagram-border)] flex justify-end">
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-[var(--instagram-blue)] hover:bg-[var(--instagram-blue)]/90 text-white disabled:opacity-50"
                aria-label="게시물 공유하기"
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

