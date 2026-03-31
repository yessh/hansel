'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Map, {
  Marker,
  NavigationControl,
  type MapRef,
  type MapMouseEvent,
} from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { useGeolocation } from '@/hooks/useGeolocation';
import type { Post } from '@/types/post';
import RadiusCircle from './RadiusCircle';
import BreadcrumbMarker from './BreadcrumbMarker';
import PostDrawer from '@/components/PostDrawer';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080';

// light-v11 스타일에서 숨길 레이어 (POI, 아이콘 등)
const POI_LAYERS_TO_HIDE = [
  'poi-label',
  'transit-label',
  'airport-label',
  'road-label',
  'waterway-label',
];

export default function MainMap() {
  const { latitude, longitude, loading, error } = useGeolocation();
  const mapRef = useRef<MapRef>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [hasCentered, setHasCentered] = useState(false);

  // 최초 위치 확인 시 지도 중심 이동
  useEffect(() => {
    if (latitude && longitude && !hasCentered && mapRef.current) {
      mapRef.current.flyTo({ center: [longitude, latitude], zoom: 17, duration: 1200 });
      setHasCentered(true);
    }
  }, [latitude, longitude, hasCentered]);

  // 위치가 바뀔 때마다 주변 게시글 재조회
  useEffect(() => {
    if (!latitude || !longitude) return;

    fetch(`${API_BASE}/api/posts/nearby?latitude=${latitude}&longitude=${longitude}`)
      .then((res) => res.json())
      .then(setPosts)
      .catch(() => {/* 개발 중 API 미연결 시 무시 */});
  }, [latitude, longitude]);

  // 지도 로드 후 불필요한 POI 레이어 숨기기
  const handleMapLoad = useCallback((event: { target: mapboxgl.Map }) => {
    const map = event.target;
    POI_LAYERS_TO_HIDE.forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      }
    });
  }, []);

  const handleMarkerClick = useCallback(
    (post: Post) => (e: MapMouseEvent) => {
      e.originalEvent.stopPropagation();
      setSelectedPost(post);
    },
    [],
  );

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
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: longitude ?? 126.978,
          latitude: latitude ?? 37.5665,
          zoom: 15,
        }}
        style={{ width: '100%', height: '100%' }}
        // Light v11: 연한 그레이/화이트 단색 톤 지도
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        onLoad={handleMapLoad}
      >
        {/* 반경 100m 원 */}
        {latitude && longitude && (
          <RadiusCircle latitude={latitude} longitude={longitude} radiusMeters={100} />
        )}

        {/* 현재 위치 마커 — 파란 점 + 펄스 애니메이션 */}
        {latitude && longitude && (
          <Marker latitude={latitude} longitude={longitude} anchor="center">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-8 h-8 rounded-full bg-indigo-400 opacity-30 animate-ping" />
              <span className="relative w-4 h-4 rounded-full bg-indigo-600 border-2 border-white shadow-md" />
            </div>
          </Marker>
        )}

        {/* 빵 부스러기 마커 (주변 게시글) */}
        {posts.map((post) => (
          <Marker
            key={post.id}
            latitude={post.latitude}
            longitude={post.longitude}
            anchor="bottom"
            onClick={handleMarkerClick(post)}
          >
            <BreadcrumbMarker />
          </Marker>
        ))}

        <NavigationControl position="top-right" showCompass={false} />
      </Map>

      {/* 상단 타이틀 오버레이 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
          <span className="text-sm font-medium text-gray-600">
            반경 <span className="text-indigo-600 font-semibold">100m</span> 이내 빵 부스러기{' '}
            <span className="text-indigo-600 font-semibold">{posts.length}</span>개
          </span>
        </div>
      </div>

      {/* 게시글 하단 드로어 */}
      <PostDrawer post={selectedPost} onClose={() => setSelectedPost(null)} />
    </div>
  );
}
