'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, Clock, MapPin } from 'lucide-react';
import type { Post } from '@/types/post';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080';

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(iso));
}

async function getDistrictName(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ko`,
      { headers: { 'User-Agent': 'Hansel-App/1.0' } }
    );
    const data = await res.json();
    const addr = data.address ?? {};
    return addr.city_district || addr.county || addr.suburb || addr.city || '알 수 없는 위치';
  } catch {
    return '알 수 없는 위치';
  }
}

export default function MyPostsPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [locationNames, setLocationNames] = useState<Record<number, string>>({});
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn) {
      router.replace('/');
      return;
    }

    const accessToken = localStorage.getItem('hansel_access_token');
    fetch(`${API_BASE}/api/posts/my`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data: Post[]) => {
        setPosts(data);
        setFetching(false);
        // 각 게시글 위치를 순차적으로 역지오코딩 (Nominatim 1req/s 정책)
        data.forEach((post, i) => {
          setTimeout(async () => {
            const name = await getDistrictName(post.latitude, post.longitude);
            setLocationNames((prev) => ({ ...prev, [post.id]: name }));
          }, i * 300);
        });
      })
      .catch(() => setFetching(false));
  }, [isLoggedIn, isLoading, router]);

  const showSpinner = isLoading || fetching;

  if (showSpinner) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 z-10">
        <div className="flex items-center gap-2 px-4 h-14 max-w-lg mx-auto">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-base font-semibold text-gray-800">내가 쓴 글</h1>
          <span className="ml-auto text-xs text-gray-400">{posts.length}개</span>
        </div>
      </header>

      {/* 목록 */}
      <main className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {posts.length === 0 ? (
          <div className="text-center py-24 space-y-2">
            <p className="text-3xl">🍞</p>
            <p className="text-sm text-gray-400">아직 남긴 빵 부스러기가 없어요.</p>
          </div>
        ) : (
          posts.map((post) => (
            <button
              key={post.id}
              onClick={() => router.push(`/my-posts/${post.id}`)}
              className="w-full text-left bg-white rounded-2xl p-4 shadow-sm hover:shadow-md active:scale-[0.99] transition-all"
            >
              {/* 글 내용 (최대 2줄) */}
              <p className="text-gray-800 text-[15px] leading-relaxed line-clamp-2">
                {post.content}
              </p>

              {/* 메타 */}
              <div className="flex items-center gap-4 mt-3">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3 shrink-0" />
                  {formatDate(post.createdAt)}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {locationNames[post.id] ?? '···'}
                </span>
              </div>
            </button>
          ))
        )}
      </main>
    </div>
  );
}
