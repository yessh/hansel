'use client';

import { useState, useEffect } from 'react';

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
}

const DEFAULT_STATE: GeolocationState = {
  latitude: null,
  longitude: null,
  accuracy: null,
  loading: true,
  error: null,
};

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>(DEFAULT_STATE);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ ...DEFAULT_STATE, loading: false, error: '이 브라우저는 위치 서비스를 지원하지 않습니다.' });
      return;
    }

    // watchPosition: 위치가 바뀔 때마다 실시간으로 콜백 호출
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
        });
      },
      (err) => {
        const messages: Record<number, string> = {
          1: '위치 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.',
          2: '위치를 확인할 수 없습니다.',
          3: '위치 요청 시간이 초과되었습니다.',
        };
        setState((prev) => ({
          ...prev,
          loading: false,
          error: messages[err.code] ?? '알 수 없는 오류가 발생했습니다.',
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 0,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}
