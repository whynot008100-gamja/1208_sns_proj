/**
 * @file app/(main)/search/page.tsx
 * @description 검색 페이지
 *
 * 일반 검색 기능을 제공하는 페이지입니다.
 * 게시물의 caption, title과 사용자 이름을 검색할 수 있습니다.
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import PostCard from "@/components/post/PostCard";
import PostCardSkeleton from "@/components/post/PostCardSkeleton";
import PostModal from "@/components/post/PostModal";
import type { PostWithStats, User } from "@/lib/types";
import Link from "next/link";

type SearchType = "all" | "posts" | "users";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [searchType, setSearchType] = useState<SearchType>("all");
  const [posts, setPosts] = useState<PostWithStats[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [postUsers, setPostUsers] = useState<User[]>([]); // 게시물 작성자 정보
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // URL 쿼리 파라미터와 동기화
  useEffect(() => {
    const urlQuery = searchParams.get("q");
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery);
      performSearch(urlQuery, searchType);
    } else if (!urlQuery && query) {
      // URL에 쿼리가 없으면 검색 초기화
      setQuery("");
      setPosts([]);
      setUsers([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 검색 실행 함수
  const performSearch = useCallback(
    async (searchQuery: string, type: SearchType = "all") => {
      if (!searchQuery.trim()) {
        setPosts([]);
        setUsers([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          q: searchQuery.trim(),
          type,
          limit: "20",
          offset: "0",
        });

        const response = await fetch(`/api/search?${params.toString()}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "검색에 실패했습니다.");
        }

        const data = await response.json();
        setPosts(data.posts || []);
        setUsers(data.users || []);
        setPostUsers(data.postUsers || []);
      } catch (err) {
        console.error("Search error:", err);
        setError(
          err instanceof Error ? err.message : "검색 중 오류가 발생했습니다."
        );
        setPosts([]);
        setUsers([]);
        setPostUsers([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 검색 실행 (디바운스)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        // URL 업데이트
        const params = new URLSearchParams();
        if (query.trim()) {
          params.set("q", query.trim());
        }
        if (searchType !== "all") {
          params.set("type", searchType);
        }
        const newUrl = params.toString()
          ? `/search?${params.toString()}`
          : "/search";
        router.replace(newUrl, { scroll: false });

        // 검색 실행
        performSearch(query, searchType);
      } else {
        setPosts([]);
        setUsers([]);
        setError(null);
        router.replace("/search", { scroll: false });
      }
    }, 300); // 300ms 디바운스

    return () => clearTimeout(timer);
  }, [query, searchType, performSearch, router]);

  // 게시물 클릭 핸들러
  const handlePostClick = useCallback((postId: string) => {
    setSelectedPostId(postId);
    setIsModalOpen(true);
  }, []);

  // 선택된 게시물 정보
  const selectedPost = useMemo(() => {
    if (!selectedPostId) return undefined;
    return posts.find((p) => p.id === selectedPostId);
  }, [selectedPostId, posts]);

  // 게시물 작성자 맵 생성
  const postUserMap = useMemo(() => {
    const map = new Map<string, User>();
    postUsers.forEach((user) => {
      map.set(user.id, user);
    });
    return map;
  }, [postUsers]);

  // 검색 결과가 없는 경우
  const hasResults = posts.length > 0 || users.length > 0;
  const showEmptyState = !loading && query.trim() && !hasResults;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-8">
      {/* 검색 입력 필드 */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="검색..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-4 py-6 text-base"
            autoFocus
          />
        </div>

        {/* 검색 타입 선택 (탭) */}
        {query.trim() && (
          <div className="flex gap-4 mt-4 border-b border-gray-200">
            <button
              onClick={() => setSearchType("all")}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                searchType === "all"
                  ? "text-black border-b-2 border-black"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setSearchType("posts")}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                searchType === "posts"
                  ? "text-black border-b-2 border-black"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              게시물
            </button>
            <button
              onClick={() => setSearchType("users")}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                searchType === "users"
                  ? "text-black border-b-2 border-black"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              사용자
            </button>
          </div>
        )}
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="space-y-4">
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* 빈 상태 */}
      {showEmptyState && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            &quot;{query}&quot;에 대한 검색 결과가 없습니다.
          </p>
        </div>
      )}

      {/* 검색 결과 */}
      {!loading && !error && hasResults && (
        <div className="space-y-8">
          {/* 게시물 결과 */}
          {(searchType === "all" || searchType === "posts") &&
            posts.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">게시물</h2>
                <div className="space-y-4">
                  {posts.map((post) => {
                    const user = postUserMap.get(post.user_id);
                    return (
                      <PostCard
                        key={post.id}
                        post={post}
                        user={user}
                        onImageClick={handlePostClick}
                      />
                    );
                  })}
                </div>
              </div>
            )}

          {/* 사용자 결과 */}
          {(searchType === "all" || searchType === "users") &&
            users.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">사용자</h2>
                <div className="space-y-2">
                  {users.map((user) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.clerk_id}`}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{user.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* 초기 상태 (검색어가 없을 때) */}
      {!query.trim() && !loading && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            검색어를 입력하여 게시물과 사용자를 찾아보세요.
          </p>
        </div>
      )}

      {/* 게시물 상세 모달 */}
      {selectedPost && (
        <PostModal
          postId={selectedPost.id}
          post={selectedPost}
          user={postUserMap.get(selectedPost.user_id)}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      )}
    </div>
  );
}
