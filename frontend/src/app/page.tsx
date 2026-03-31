import dynamic from 'next/dynamic';

/**
 * mapbox-gl은 브라우저 전용 API(WebGL, Canvas)를 사용하므로 SSR 비활성화.
 * dynamic import로 클라이언트에서만 렌더링.
 */
const MainMap = dynamic(() => import('@/components/Map/MainMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400">Hänsel 불러오는 중...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return <MainMap />;
}
