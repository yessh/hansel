'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080';

function KakaoCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  // React Strict Mode에서 useEffect가 두 번 실행되는 것을 방지
  // (카카오 OAuth 코드는 1회용이므로 두 번 사용하면 두 번째가 실패함)
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const code = searchParams.get('code');
    if (!code) {
      router.replace('/');
      return;
    }

    fetch(`${API_BASE}/api/auth/kakao/callback?code=${encodeURIComponent(code)}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (!data.accessToken) throw new Error('토큰이 없습니다');

        login(
          { accessToken: data.accessToken, refreshToken: data.refreshToken },
          data.user
        );

        const pendingAction = sessionStorage.getItem('hansel_pending_action');
        sessionStorage.removeItem('hansel_pending_action');

        if (pendingAction === 'create') {
          router.replace('/?action=create');
        } else {
          router.replace('/');
        }
      })
      .catch(err => {
        console.error('[카카오 로그인 실패]', err);
        router.replace('/');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500">카카오 로그인 중...</p>
      </div>
    </div>
  );
}

export default function KakaoCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <KakaoCallback />
    </Suspense>
  );
}
