export interface AuthUser {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isLoggedIn: boolean;
  isLoading: boolean;
}
