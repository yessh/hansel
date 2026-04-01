'use client';

import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, MapPin, Clock, Heart, MessageCircle, Send } from 'lucide-react';
import Image from 'next/image';
import type { Post, Comment, LikeStatus } from '@/types/post';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080';

interface Props {
  post: Post | null;
  onClose: () => void;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
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

export default function PostDrawer({ post, onClose }: Props) {
  const [likeStatus, setLikeStatus] = useState<LikeStatus>({ count: 0, liked: false });
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Escape 키로 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // 게시글 바뀔 때마다 좋아요·댓글 조회
  useEffect(() => {
    if (!post) return;
    const token = localStorage.getItem('hansel_access_token');
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${API_BASE}/api/posts/${post.id}/likes`, { headers })
      .then((r) => r.json())
      .then(setLikeStatus)
      .catch(() => {});

    fetch(`${API_BASE}/api/posts/${post.id}/comments`, { headers })
      .then((r) => r.json())
      .then(setComments)
      .catch(() => {});

    setCommentInput('');
  }, [post?.id]);

  function handleLike() {
    if (!post) return;
    const token = localStorage.getItem('hansel_access_token');
    if (!token) return;

    fetch(`${API_BASE}/api/posts/${post.id}/likes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setLikeStatus)
      .catch(() => {});
  }

  async function handleCommentSubmit() {
    if (!post || !commentInput.trim()) return;
    const token = localStorage.getItem('hansel_access_token');
    if (!token) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post.id}/comments`, {
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

  return (
    <AnimatePresence>
      {post && (
        <>
          {/* 반투명 배경 오버레이 */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* 하단 드로어 */}
          <motion.div
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="게시글 상세"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80) onClose();
            }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[82vh] flex flex-col"
          >
            {/* 드래그 핸들 */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* 스크롤 가능한 본문 */}
            <div className="overflow-y-auto flex-1 px-5">
              {/* 작성자 행 */}
              <div className="flex items-center gap-3 py-4 border-b border-gray-100">
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-amber-700">
                    {post.author.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{post.author}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-400">이 위치에서 남긴 기록</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors shrink-0"
                  aria-label="닫기"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* 이미지 */}
              {post.imageUrl && (
                <div className="relative w-full aspect-[4/3] mt-4 rounded-2xl overflow-hidden bg-gray-100">
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
              <p className="mt-4 text-gray-700 leading-relaxed text-[15px] whitespace-pre-wrap">
                {post.content}
              </p>

              {/* 작성 시간 */}
              <div className="flex items-center gap-1.5 mt-3">
                <Clock className="w-3.5 h-3.5 text-gray-300" />
                <span className="text-xs text-gray-400">{formatDate(post.createdAt)}</span>
              </div>

              {/* 좋아요 · 댓글 수 */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${
                    likeStatus.liked ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'
                  }`}
                >
                  <Heart
                    className="w-4 h-4"
                    fill={likeStatus.liked ? 'currentColor' : 'none'}
                  />
                  <span>{likeStatus.count}</span>
                </button>
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <MessageCircle className="w-4 h-4" />
                  <span>{comments.length}</span>
                </div>
              </div>

              {/* 댓글 목록 */}
              <div className="mt-3 space-y-3 pb-4">
                {comments.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    아직 댓글이 없어요. 첫 댓글을 남겨보세요!
                  </p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-indigo-500">
                          {c.author.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-semibold text-gray-700">{c.author}</span>
                          <span className="text-[10px] text-gray-400">{formatCommentDate(c.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5 leading-snug">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 댓글 입력 (드로어 하단 고정) */}
            <div className="shrink-0 px-4 py-3 border-t border-gray-100 flex items-center gap-2 bg-white">
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
                className="flex-1 text-sm text-gray-900 bg-gray-100 rounded-full px-4 py-2 outline-none placeholder:text-gray-400"
              />
              <button
                onClick={handleCommentSubmit}
                disabled={!commentInput.trim() || submittingComment}
                className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center disabled:opacity-40 transition-opacity shrink-0"
                aria-label="댓글 전송"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
