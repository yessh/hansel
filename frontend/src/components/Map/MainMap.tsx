'use client';

import { useState, useEffect, useRef } from 'react';
import { NaverMap, Marker, Circle, Container, useNavermaps } from 'react-naver-maps';

import { useGeolocation } from '@/hooks/useGeolocation';
import type { Post } from '@/types/post';
import { BREADCRUMB_MARKER_HTML, CURRENT_LOCATION_MARKER_HTML } from './BreadcrumbMarker';
import PostDrawer from '@/components/PostDrawer';
import PostCreateDrawer from '@/components/PostCreateDrawer';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080';

// 빵 부스러기 마커 아이콘 옵션 — 앵커를 SVG 하단 중앙에 맞춤
const BREADCRUMB_ICON: naver.maps.HtmlIcon = {
  content: BREADCRUMB_MARKER_HTML,
  anchor: { x: 16, y: 28 } as naver.maps.Point,
};

// 현재 위치 마커 아이콘 옵션 — 앵커를 원의 중앙에 맞춤
const CURRENT_LOCATION_ICON: naver.maps.HtmlIcon = {
  content: CURRENT_LOCATION_MARKER_HTML,
  anchor: { x: 16, y: 16 } as naver.maps.Point,
};

export default function MainMap() {
  const navermaps = useNavermaps();
  const mapRef = useRef<naver.maps.Map | null>(null);
  const { latitude, longitude, loading, error } = useGeolocation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [hasCentered, setHasCentered] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 최초 위치 확인 시 지도 중심 이동 (panTo + zoom)
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
      .catch(() => { /* 개발 중 API 미연결 시 무시 */ });
  }, [latitude, longitude]);

  async function handleCreatePost(author: string, content: string) {
    if (!latitude || !longitude) return;
    setSubmitting(true);
    try {
      await fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, content, latitude, longitude }),
      });
      setIsCreateOpen(false);
      const res = await fetch(`${API_BASE}/api/posts/nearby?latitude=${latitude}&longitude=${longitude}`);
      setPosts(await res.json());
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
      {/* Container가 ContainerContext를 제공해야 NaverMap이 DOM 엘리먼트를 찾을 수 있음 */}
      <Container style={{ width: '100%', height: '100%' }}>
      <NaverMap
        ref={mapRef}
        defaultCenter={{ lat: latitude ?? 37.5665, lng: longitude ?? 126.978 }}
        defaultZoom={15}
        // UI 컨트롤 최소화 — 깔끔한 단색 느낌
        mapTypeControl={false}
        zoomControl={false}
        scaleControl={false}
        mapDataControl={false}
        // 참고: NAVER Maps 무료 플랜에서는 Mapbox처럼 POI를 선택적으로 숨기는
        // 커스텀 맵 스타일 기능을 지원하지 않습니다.
        // 프리미엄 플랜에서 mapTypes 커스텀 타일로 구현 가능합니다.
      >
        {/* 반경 100m 투명 원 */}
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

        {/* 현재 위치 마커 — 파란 점 + 펄스 애니메이션 */}
        {latitude && longitude && (
          <Marker
            position={{ lat: latitude, lng: longitude }}
            icon={CURRENT_LOCATION_ICON}
            zIndex={10}
          />
        )}

        {/* 빵 부스러기 마커 (주변 게시글) */}
        {posts.map((post) => (
          <Marker
            key={post.id}
            position={{ lat: post.latitude, lng: post.longitude }}
            icon={BREADCRUMB_ICON}
            onClick={() => setSelectedPost(post)}
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
        onClick={() => setIsCreateOpen(true)}
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
    </div>
  );
}
