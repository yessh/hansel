'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { AuthUser, AuthTokens, AuthState } from '@/types/auth';

const STORAGE_KEY_ACCESS = 'hansel_access_token';
const STORAGE_KEY_REFRESH = 'hansel_refresh_token';
const STORAGE_KEY_USER = 'hansel_user';

interface AuthContextValue extends AuthState {
  login: (tokens: AuthTokens, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    tokens: null,
    isLoggedIn: false,
    isLoading: true,
  });

  const login = useCallback((tokens: AuthTokens, user: AuthUser) => {
    localStorage.setItem(STORAGE_KEY_ACCESS, tokens.accessToken);
    localStorage.setItem(STORAGE_KEY_REFRESH, tokens.refreshToken);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    setState({ user, tokens, isLoggedIn: true, isLoading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_ACCESS);
    localStorage.removeItem(STORAGE_KEY_REFRESH);
    localStorage.removeItem(STORAGE_KEY_USER);
    setState({ user: null, tokens: null, isLoggedIn: false, isLoading: false });
  }, []);

  // 마운트 시 localStorage에서 세션 복원 (네트워크 요청 없이 즉시 복원)
  useEffect(() => {
    const accessToken = localStorage.getItem(STORAGE_KEY_ACCESS);
    const refreshToken = localStorage.getItem(STORAGE_KEY_REFRESH);
    const userJson = localStorage.getItem(STORAGE_KEY_USER);

    if (!accessToken || !refreshToken || !userJson) {
      setState(s => ({ ...s, isLoading: false }));
      return;
    }

    // JWT 만료 여부 확인 (네트워크 없이 클라이언트에서 체크)
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();

      if (isExpired) {
        // access token 만료 → refresh 시도
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080';
        fetch(`${API_BASE}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })
          .then(res => {
            if (!res.ok) throw new Error('refresh failed');
            return res.json();
          })
          .then(data => {
            localStorage.setItem(STORAGE_KEY_ACCESS, data.accessToken);
            localStorage.setItem(STORAGE_KEY_REFRESH, data.refreshToken);
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
            setState({
              user: data.user,
              tokens: { accessToken: data.accessToken, refreshToken: data.refreshToken },
              isLoggedIn: true,
              isLoading: false,
            });
          })
          .catch(() => {
            localStorage.removeItem(STORAGE_KEY_ACCESS);
            localStorage.removeItem(STORAGE_KEY_REFRESH);
            localStorage.removeItem(STORAGE_KEY_USER);
            setState({ user: null, tokens: null, isLoggedIn: false, isLoading: false });
          });
      } else {
        // 유효한 토큰 — 바로 복원
        const user = JSON.parse(userJson) as AuthUser;
        setState({
          user,
          tokens: { accessToken, refreshToken },
          isLoggedIn: true,
          isLoading: false,
        });
      }
    } catch {
      // 토큰 파싱 실패
      localStorage.removeItem(STORAGE_KEY_ACCESS);
      localStorage.removeItem(STORAGE_KEY_REFRESH);
      localStorage.removeItem(STORAGE_KEY_USER);
      setState({ user: null, tokens: null, isLoggedIn: false, isLoading: false });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
