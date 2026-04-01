'use client';

import { NavermapsProvider } from 'react-naver-maps';
import { AuthProvider } from '@/contexts/AuthContext';

// NAVER Cloud Platform > Application Services > Maps > Web Dynamic Map 에서 발급
const NAVER_KEY_ID = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID ?? '';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NavermapsProvider ncpKeyId={NAVER_KEY_ID}>
        {children}
      </NavermapsProvider>
    </AuthProvider>
  );
}
