'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID ?? '';
const KAKAO_REDIRECT_URI = 'http://localhost:3000/auth/kakao';

interface Props {
  open: boolean;
  onClose: () => void;
  pendingAction?: 'view' | 'create';
}

export default function LoginBottomSheet({ open, onClose, pendingAction }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function handleKakaoLogin() {
    if (pendingAction) {
      sessionStorage.setItem('hansel_pending_action', pendingAction);
    }
    const kakaoAuthUrl =
      `https://kauth.kakao.com/oauth/authorize` +
      `?client_id=${KAKAO_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}` +
      `&response_type=code`;
    window.location.href = kakaoAuthUrl;
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="login-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            key="login-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="로그인"
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
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl"
          >
            {/* 드래그 핸들 */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            <div className="px-5 pb-10 pt-2 flex flex-col items-center gap-5">
              {/* 헤더 */}
              <div className="flex justify-between w-full items-center">
                <span className="text-sm font-semibold text-gray-800">로그인이 필요합니다</span>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="닫기"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* 안내 문구 */}
              <div className="text-center space-y-1.5 py-2">
                <p className="text-2xl">🍞</p>
                <p className="text-sm text-gray-600 font-medium">
                  {pendingAction === 'create'
                    ? '빵 부스러기를 남기려면 로그인이 필요해요'
                    : '게시글을 읽으려면 로그인이 필요해요'}
                </p>
                <p className="text-xs text-gray-400">카카오 계정으로 간편하게 시작하세요</p>
              </div>

              {/* 카카오 로그인 버튼 */}
              <button
                onClick={handleKakaoLogin}
                className="w-full py-3.5 rounded-xl bg-[#FEE500] text-[#3C1E1E] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#FFDE00] active:bg-[#F0D800] transition-colors"
              >
                {/* 카카오 로고 */}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M9 1.5C4.86 1.5 1.5 4.14 1.5 7.38c0 2.07 1.38 3.9 3.48 4.98L4.2 15.3a.19.19 0 0 0 .27.21l3.78-2.49c.24.03.48.03.75.03 4.14 0 7.5-2.64 7.5-5.88S13.14 1.5 9 1.5Z"
                    fill="#3C1E1E"
                  />
                </svg>
                카카오로 계속하기
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
