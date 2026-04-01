'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { NaverMap, Marker, Circle, Container, useNavermaps } from 'react-naver-maps';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, PenLine } from 'lucide-react';

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

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const rad1 = lat1 * Math.PI / 180;
  const rad2 = lat2 * Math.PI / 180;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad1) * Math.cos(rad2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MainMap() {
  const navermaps = useNavermaps();
  const mapRef = useRef<naver.maps.Map | null>(null);
  const { latitude, longitude, loading, error } = useGeolocation();
  const { isLoggedIn } = useAuth();

  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [hasCentered, setHasCentered] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'view' | 'create'>('view');
  const [fabOpen, setFabOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function showToast(message: string) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }

  function fetchPostsInBounds() {
    if (!mapRef.current) return;
    const bounds = mapRef.current.getBounds() as naver.maps.LatLngBounds;
    const sw = bounds.getSW();
    const ne = bounds.getNE();
    fetch(`${API_BASE}/api/posts/in-bounds?swLat=${sw.lat()}&swLng=${sw.lng()}&neLat=${ne.lat()}&neLng=${ne.lng()}`)
      .then((res) => res.json())
      .then(setPosts)
      .catch(() => {});
  }

  // 최초 위치 확인 시 지도 중심 이동 + idle 리스너 등록
  useEffect(() => {
    if (latitude && longitude && !hasCentered && mapRef.current) {
      mapRef.current.panTo(new navermaps.LatLng(latitude, longitude));
      mapRef.current.setZoom(17, true);
      setHasCentered(true);
      mapRef.current.addListener('idle', fetchPostsInBounds);
      fetchPostsInBounds();
    }
  }, [latitude, longitude, hasCentered, navermaps]);

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
    if (latitude === null || longitude === null) return;
    const dist = getDistanceMeters(latitude, longitude, post.latitude, post.longitude);
    if (dist > 50) {
      showToast('이 빵 부스러기를 읽으려면 50m 이내에 있어야 합니다.');
      return;
    }
    const hasToken = localStorage.getItem('hansel_access_token');
    if (!hasToken) {
      setPendingAction('view');
      setLoginSheetOpen(true);
    } else {
      setSelectedPost(post);
    }
  }

  function handleFabToggle() {
    setFabOpen((prev) => !prev);
  }

  function handleCreateClick() {
    setFabOpen(false);
    const hasToken = localStorage.getItem('hansel_access_token');
    if (!hasToken) {
      setPendingAction('create');
      setLoginSheetOpen(true);
    } else {
      setIsCreateOpen(true);
    }
  }

  function handleMyPostsClick() {
    setFabOpen(false);
    const hasToken = localStorage.getItem('hansel_access_token');
    if (!hasToken) {
      setPendingAction('view');
      setLoginSheetOpen(true);
    } else {
      router.push('/my-posts');
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
      fetchPostsInBounds();
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
              radius={50}
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
            지도 내 빵 부스러기{' '}
            <span className="text-indigo-600 font-semibold">{posts.length}</span>개
          </span>
        </div>
      </div>

      {/* 거리 제한 토스트 */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          >
            <div className="bg-gray-800/90 text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-lg whitespace-nowrap">
              {toastMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB 메뉴 영역 */}
      <div className="absolute bottom-8 right-5 z-10 flex flex-col items-end gap-3">
        <AnimatePresence>
          {fabOpen && (
            <>
              {/* 내가 쓴 글 */}
              <motion.button
                key="my-posts"
                initial={{ opacity: 0, y: 12, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.85 }}
                transition={{ duration: 0.18, delay: 0.06 }}
                onClick={handleMyPostsClick}
                className="flex items-center gap-2 bg-white rounded-full px-4 py-2.5 shadow-lg text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-indigo-500" />
                내가 쓴 글
              </motion.button>

              {/* 글 쓰기 */}
              <motion.button
                key="create"
                initial={{ opacity: 0, y: 12, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.85 }}
                transition={{ duration: 0.18 }}
                onClick={handleCreateClick}
                className="flex items-center gap-2 bg-white rounded-full px-4 py-2.5 shadow-lg text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <PenLine className="w-4 h-4 text-amber-500" />
                글 쓰기
              </motion.button>
            </>
          )}
        </AnimatePresence>

        {/* 메인 FAB (+/×) */}
        <motion.button
          onClick={handleFabToggle}
          animate={{ rotate: fabOpen ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          className="w-14 h-14 rounded-full bg-amber-500 shadow-lg flex items-center justify-center hover:bg-amber-600 active:bg-amber-700 transition-colors"
          aria-label={fabOpen ? '메뉴 닫기' : '메뉴 열기'}
        >
          <span className="text-white text-2xl font-light leading-none">+</span>
        </motion.button>
      </div>

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
