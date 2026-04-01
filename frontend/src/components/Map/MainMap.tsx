'use client';

import { useState, useEffect, useRef } from 'react';
import { NaverMap, Marker, Circle, Container, useNavermaps } from 'react-naver-maps';

import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuth } from '@/contexts/AuthContext';
import type { Post } from '@/types/post';
import { BREADCRUMB_MARKER_HTML, CURRENT_LOCATION_MARKER_HTML } from './BreadcrumbMarker';
import PostDrawer from '@/components/PostDrawer';
import PostCreateDrawer from '@/components/PostCreateDrawer';
import LoginBottomSheet from '@/components/LoginBottomSheet';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080';

const BREADCRUMB_ICON: naver.maps.HtmlIcon = {
  content: BREADCRUMB_MARKER_HTML,
  anchor: { x: 16, y: 28 } as naver.maps.Point,
};

const CURRENT_LOCATION_ICON: naver.maps.HtmlIcon = {
  content: CURRENT_LOCATION_MARKER_HTML,
  anchor: { x: 16, y: 16 } as naver.maps.Point,
};

export default function MainMap() {
  const navermaps = useNavermaps();
  const mapRef = useRef<naver.maps.Map | null>(null);
  const { latitude, longitude, loading, error } = useGeolocation();
  const { isLoggedIn } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [hasCentered, setHasCentered] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'view' | 'create'>('view');

  // 최초 위치 확인 시 지도 중심 이동
  useEffect(() => {
    if (latitude && longitude && !hasCentered && mapRef.current) {
      mapRef.current.panTo(new navermaps.LatLng(latitude, longitude));
      mapRef.current.setZoom(17, true);
      setHasCentered(true);
    }
  }, [latitude, longitude, hasCentered, navermaps]);

  // 위치가 바뀔 때마다 주변 게시글 재조회
  useEffect(() => {
    if (!latitude || !longitude) return;

    fetch(`${API_BASE}/api/posts/nearby?latitude=${latitude}&longitude=${longitude}`)
      .then((res) => res.json())
      .then(setPosts)
      .catch(() => {});
  }, [latitude, longitude]);

  // 로그인 후 ?action=create 쿼리 처리
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'create' && isLoggedIn) {
      setIsCreateOpen(true);
      window.history.replaceState({}, '', '/');
    }
  }, [isLoggedIn]);

  function handleMarkerClick(post: Post) {
    // localStorage에서 토큰 확인 (최신 상태)
    const hasToken = localStorage.getItem('hansel_access_token');
    if (!hasToken) {
      setPendingAction('view');
      setLoginSheetOpen(true);
    } else {
      setSelectedPost(post);
    }
  }

  function handleFabClick() {
    // localStorage에서 토큰 확인 (최신 상태)
    const hasToken = localStorage.getItem('hansel_access_token');
    if (!hasToken) {
      setPendingAction('create');
      setLoginSheetOpen(true);
    } else {
      setIsCreateOpen(true);
    }
  }

  async function handleCreatePost(content: string) {
    if (!latitude || !longitude) return;

    // localStorage에서 직접 토큰 읽기 (최신 값 보장)
    const accessToken = localStorage.getItem('hansel_access_token');
    if (!accessToken) {
      setLoginSheetOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ content, latitude, longitude }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      setIsCreateOpen(false);
      const postsRes = await fetch(`${API_BASE}/api/posts/nearby?latitude=${latitude}&longitude=${longitude}`);
      setPosts(await postsRes.json());
    } catch (error) {
      console.error('글 작성 실패:', error);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">위치를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 px-6">
        <div className="text-center space-y-2 max-w-xs">
          <p className="text-2xl">📍</p>
          <p className="font-semibold text-gray-800">위치 접근이 필요합니다</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Container style={{ width: '100%', height: '100%' }}>
        <NaverMap
          ref={mapRef}
          defaultCenter={{ lat: latitude ?? 37.5665, lng: longitude ?? 126.978 }}
          defaultZoom={15}
          mapTypeControl={false}
          zoomControl={false}
          scaleControl={false}
          mapDataControl={false}
        >
          {latitude && longitude && (
            <Circle
              center={{ lat: latitude, lng: longitude }}
              radius={100}
              fillColor="#6366F1"
              fillOpacity={0.08}
              strokeColor="#6366F1"
              strokeWeight={1.5}
              strokeOpacity={0.5}
              strokeStyle="shortdash"
            />
          )}

          {latitude && longitude && (
            <Marker
              position={{ lat: latitude, lng: longitude }}
              icon={CURRENT_LOCATION_ICON}
              zIndex={10}
            />
          )}

          {posts.map((post) => (
            <Marker
              key={post.id}
              position={{ lat: post.latitude, lng: post.longitude }}
              icon={BREADCRUMB_ICON}
              onClick={() => handleMarkerClick(post)}
            />
          ))}
        </NaverMap>
      </Container>

      {/* 상단 타이틀 오버레이 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
          <span className="text-sm font-medium text-gray-600">
            반경 <span className="text-indigo-600 font-semibold">100m</span> 이내 빵 부스러기{' '}
            <span className="text-indigo-600 font-semibold">{posts.length}</span>개
          </span>
        </div>
      </div>

      {/* 글쓰기 FAB 버튼 */}
      <button
        onClick={handleFabClick}
        className="absolute bottom-8 right-5 z-10 w-14 h-14 rounded-full bg-amber-500 shadow-lg flex items-center justify-center hover:bg-amber-600 active:bg-amber-700 transition-colors"
        aria-label="게시글 작성"
      >
        <span className="text-white text-2xl font-light leading-none">+</span>
      </button>

      {/* 게시글 하단 드로어 */}
      <PostDrawer post={selectedPost} onClose={() => setSelectedPost(null)} />

      {/* 게시글 작성 드로어 */}
      <PostCreateDrawer
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreatePost}
        submitting={submitting}
      />

      {/* 로그인 하단 시트 */}
      <LoginBottomSheet
        open={loginSheetOpen}
        onClose={() => setLoginSheetOpen(false)}
        pendingAction={pendingAction}
      />
    </div>
  );
}
