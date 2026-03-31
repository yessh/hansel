'use client';

import { Source, Layer } from 'react-map-gl';
import type { FillLayer, LineLayer } from 'react-map-gl';

interface Props {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

/**
 * 위경도 기준으로 반경(미터)을 GeoJSON Polygon으로 근사 변환.
 * 위도에 따른 경도 1도의 실제 거리 차이를 보정.
 */
function buildCircleGeoJSON(
  longitude: number,
  latitude: number,
  radiusMeters: number,
): GeoJSON.FeatureCollection {
  const POINTS = 64;
  // 위도 방향: 1도 ≈ 110,540m (일정)
  const deltaLat = radiusMeters / 110_540;
  // 경도 방향: 위도에 따라 보정 필요
  const deltaLng = radiusMeters / (111_320 * Math.cos((latitude * Math.PI) / 180));

  const coords: [number, number][] = Array.from({ length: POINTS }, (_, i) => {
    const angle = (i / POINTS) * 2 * Math.PI;
    return [longitude + deltaLng * Math.cos(angle), latitude + deltaLat * Math.sin(angle)];
  });
  coords.push(coords[0]); // ring을 닫음

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [coords] },
        properties: {},
      },
    ],
  };
}

const fillLayer: FillLayer = {
  id: 'radius-fill',
  type: 'fill',
  paint: {
    'fill-color': '#6366F1', // indigo-500
    'fill-opacity': 0.08,
  },
};

const borderLayer: LineLayer = {
  id: 'radius-border',
  type: 'line',
  paint: {
    'line-color': '#6366F1',
    'line-width': 1.5,
    'line-opacity': 0.5,
    'line-dasharray': [4, 3], // 점선으로 '경계' 느낌 강조
  },
};

export default function RadiusCircle({ latitude, longitude, radiusMeters }: Props) {
  const geoJSON = buildCircleGeoJSON(longitude, latitude, radiusMeters);

  return (
    <Source id="radius-circle" type="geojson" data={geoJSON}>
      <Layer {...fillLayer} />
      <Layer {...borderLayer} />
    </Source>
  );
}
