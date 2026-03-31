'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, MapPin, Clock } from 'lucide-react';
import Image from 'next/image';
import type { Post } from '@/types/post';

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

export default function PostDrawer({ post, onClose }: Props) {
  // Escape 키로 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

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
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[78vh] flex flex-col"
          >
            {/* 드래그 핸들 */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* 스크롤 가능한 본문 영역 */}
            <div className="overflow-y-auto flex-1 px-5 pb-10">
              {/* 작성자 행 */}
              <div className="flex items-center gap-3 py-4 border-b border-gray-100">
                {/* 아바타 */}
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-amber-700">
                    {post.author.charAt(0)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{post.author}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-400">100m 이내에서 남긴 기록</span>
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

              {/* 본문 내용 */}
              <p className="mt-4 text-gray-700 leading-relaxed text-[15px] whitespace-pre-wrap">
                {post.content}
              </p>

              {/* 작성 시간 */}
              <div className="flex items-center gap-1.5 mt-4">
                <Clock className="w-3.5 h-3.5 text-gray-300" />
                <span className="text-xs text-gray-400">{formatDate(post.createdAt)}</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
