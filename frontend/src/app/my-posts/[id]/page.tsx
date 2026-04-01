'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Clock, MapPin, Heart, MessageCircle, Send, Trash2 } from 'lucide-react';
import Image from 'next/image';
import type { Post, Comment, LikeStatus } from '@/types/post';

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

function formatCommentDate(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
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

  const [likeStatus, setLikeStatus] = useState<LikeStatus>({ count: 0, liked: false });
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const accessToken = localStorage.getItem('hansel_access_token');
    if (!accessToken) {
      router.replace('/');
      return;
    }

    const headers = { Authorization: `Bearer ${accessToken}` };

    fetch(`${API_BASE}/api/posts/${id}`, { headers })
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

    fetch(`${API_BASE}/api/posts/${id}/likes`, { headers })
      .then((r) => r.json())
      .then(setLikeStatus)
      .catch(() => {});

    fetch(`${API_BASE}/api/posts/${id}/comments`, { headers })
      .then((r) => r.json())
      .then(setComments)
      .catch(() => {});
  }, [id, router]);

  function handleLike() {
    const token = localStorage.getItem('hansel_access_token');
    if (!token) return;
    fetch(`${API_BASE}/api/posts/${id}/likes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setLikeStatus)
      .catch(() => {});
  }

  async function handleCommentSubmit() {
    if (!commentInput.trim()) return;
    const token = localStorage.getItem('hansel_access_token');
    if (!token) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: commentInput.trim() }),
      });
      if (!res.ok) return;
      const newComment: Comment = await res.json();
      setComments((prev) => [...prev, newComment]);
      setCommentInput('');
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDelete() {
    const token = localStorage.getItem('hansel_access_token');
    if (!token) return;

    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) router.replace('/my-posts');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

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
    <div className="min-h-screen bg-gray-50 pb-24">
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
          <h1 className="text-base font-semibold text-gray-800 flex-1">게시글 상세</h1>
          {/* 삭제 버튼 */}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-2 rounded-full hover:bg-red-50 transition-colors"
              aria-label="삭제"
            >
              <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">삭제할까요?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-50"
              >
                삭제
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                취소
              </button>
            </div>
          )}
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
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-sm pt-4 transition-colors ${
              likeStatus.liked ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'
            }`}
          >
            <Heart className="w-4 h-4" fill={likeStatus.liked ? 'currentColor' : 'none'} />
            <span>{likeStatus.count}</span>
          </button>
          <div className="flex items-center gap-1.5 text-sm text-gray-400 pt-4">
            <MessageCircle className="w-4 h-4" />
            <span>댓글 {comments.length}개</span>
          </div>
        </div>

        {/* 댓글 목록 */}
        <div className="space-y-3">
          {comments.length === 0 ? (
            <div className="bg-white rounded-2xl px-5 py-8 shadow-sm text-center text-sm text-gray-400">
              아직 댓글이 없어요. 첫 댓글을 남겨보세요!
            </div>
          ) : (
            <div className="bg-white rounded-2xl px-5 py-4 shadow-sm space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-indigo-500">
                      {c.author.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-gray-700">{c.author}</span>
                      <span className="text-xs text-gray-400">{formatCommentDate(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 leading-snug">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 댓글 입력 (화면 하단 고정) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-2 z-10">
        <input
          ref={inputRef}
          type="text"
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleCommentSubmit();
            }
          }}
          placeholder="댓글 달기..."
          maxLength={200}
          className="flex-1 text-sm bg-gray-100 rounded-full px-4 py-2.5 outline-none placeholder:text-gray-400"
        />
        <button
          onClick={handleCommentSubmit}
          disabled={!commentInput.trim() || submittingComment}
          className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center disabled:opacity-40 transition-opacity shrink-0"
          aria-label="댓글 전송"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
