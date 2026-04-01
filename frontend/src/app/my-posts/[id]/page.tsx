'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Clock, MapPin, Heart, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import type { Post } from '@/types/post';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080';

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

export default function PostDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [locationName, setLocationName] = useState<string>('···');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem('hansel_access_token');
    if (!accessToken) {
      router.replace('/');
      return;
    }

    fetch(`${API_BASE}/api/posts/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then(async (data: Post) => {
        setPost(data);
        setLoading(false);
        const name = await getDistrictName(data.latitude, data.longitude);
        setLocationName(name);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50 gap-3">
        <p className="text-3xl">🍞</p>
        <p className="text-sm text-gray-400">글을 불러올 수 없어요.</p>
        <button
          onClick={() => router.back()}
          className="mt-2 text-sm text-indigo-500 underline underline-offset-2"
        >
          돌아가기
        </button>
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
          <h1 className="text-base font-semibold text-gray-800">게시글 상세</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* 작성자 + 날짜 */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-amber-700">
              {post.author.charAt(0)}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{post.author}</p>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{formatDate(post.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* 이미지 */}
        {post.imageUrl && (
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
            <Image
              src={post.imageUrl}
              alt="게시글 이미지"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
            />
          </div>
        )}

        {/* 본문 */}
        <div className="bg-white rounded-2xl px-5 py-4 shadow-sm">
          <p className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        {/* 위치 */}
        <div className="flex items-center gap-2 text-sm text-gray-500 px-1">
          <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{locationName}</span>
        </div>

        {/* 좋아요 · 댓글 수 */}
        <div className="flex items-center gap-5 px-1 pt-1 border-t border-gray-200">
          <div className="flex items-center gap-1.5 text-sm text-gray-400 pt-4">
            <Heart className="w-4 h-4" />
            <span>0</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-400 pt-4">
            <MessageCircle className="w-4 h-4" />
            <span>댓글 0개</span>
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div className="bg-white rounded-2xl px-5 py-8 shadow-sm text-center text-sm text-gray-400">
          아직 댓글이 없어요.
        </div>
      </main>
    </div>
  );
}
