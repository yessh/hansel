'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, PenLine } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (content: string) => Promise<void>;
  submitting: boolean;
}

export default function PostCreateDrawer({ open, onClose, onSubmit, submitting }: Props) {
  const [content, setContent] = useState('');
  const { user } = useAuth();

  // Escape 키로 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // 드로어 닫힐 때 입력값 초기화
  useEffect(() => {
    if (!open) {
      setContent('');
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    await onSubmit(content.trim());
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 반투명 배경 오버레이 */}
          <motion.div
            key="create-backdrop"
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
            key="create-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="게시글 작성"
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
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col"
          >
            {/* 드래그 핸들 */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            <form onSubmit={handleSubmit} className="px-5 pb-10 pt-2 flex flex-col gap-4">
              {/* 헤더 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-semibold text-gray-800">빵 부스러기 남기기</span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="닫기"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* 작성자 표시 */}
              {user && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-amber-700">
                      {user.nickname.charAt(0)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">{user.nickname}</span>
                </div>
              )}

              {/* 내용 입력 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500" htmlFor="content">
                  내용
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="이 자리에서 느낀 것을 남겨보세요"
                  rows={4}
                  maxLength={300}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none disabled:opacity-50"
                />
                <span className="text-xs text-gray-400 text-right">{content.length}/300</span>
              </div>

              {/* 제출 버튼 */}
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="w-full py-3 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 active:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {submitting ? '게시 중...' : '이 자리에 남기기'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
