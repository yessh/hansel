# Hänsel (헨젤) — CLAUDE.md

위치 기반 소셜 서비스. 사용자의 현재 위치에서 **반경 100m 이내**에 작성된 게시글(빵 부스러기)만 지도 위에서 볼 수 있는 공간적 SNS.

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| Backend | Java 21, Spring Boot 3.4.4, Gradle 8.8 |
| ORM / DB | Spring Data JPA, Hibernate Spatial, PostgreSQL + PostGIS 3.4 |
| Frontend | Next.js 14.2 (App Router), TypeScript 5, Tailwind CSS 3.4 |
| 지도 | Mapbox GL 2.15 + react-map-gl 7.1 |
| 애니메이션 | Framer Motion 11 |
| 아이콘 | Lucide React |
| 인프라 | Docker Compose (postgis/postgis:16-3.4) |

---

## 디렉토리 구조

```
hansel/
├── docker-compose.yml          # PostGIS DB
├── .gitignore
├── CLAUDE.md
│
├── backend/                    # Spring Boot
│   ├── build.gradle
│   ├── settings.gradle         # rootProject.name = 'hansel-backend'
│   ├── gradlew
│   └── src/main/
│       ├── java/com/hansel/
│       │   ├── HanselApplication.java          # @EnableJpaAuditing
│       │   ├── controller/
│       │   │   ├── HealthController.java        # GET /api/health
│       │   │   └── PostController.java          # POST /api/posts, GET /api/posts/nearby
│       │   ├── domain/
│       │   │   └── Post.java                    # JPA 엔티티, geometry(Point,4326)
│       │   ├── dto/
│       │   │   ├── PostCreateRequest.java       # record, @NotBlank/@NotNull 검증
│       │   │   └── PostResponse.java            # record, from(Post) 팩토리 메서드
│       │   ├── repository/
│       │   │   └── PostRepository.java          # ST_DWithin 네이티브 쿼리
│       │   └── service/
│       │       └── PostService.java             # GeometryFactory(SRID=4326)
│       └── resources/
│           └── application.yml
│
└── frontend/                   # Next.js
    ├── package.json
    ├── next.config.ts           # transpilePackages: ["mapbox-gl"]
    ├── tailwind.config.ts
    ├── .env.local.example
    └── src/
        ├── app/
        │   ├── layout.tsx       # RootLayout, lang="ko"
        │   ├── page.tsx         # dynamic(MainMap, { ssr: false })
        │   └── globals.css      # Tailwind directives, CSS 변수(라이트/다크)
        ├── types/
        │   └── post.ts          # Post interface
        ├── hooks/
        │   └── useGeolocation.ts  # watchPosition 실시간 추적
        └── components/
            ├── PostDrawer.tsx     # Framer Motion 하단 시트
            └── Map/
                ├── MainMap.tsx          # 지도 메인 컴포넌트
                ├── BreadcrumbMarker.tsx # 조약돌 SVG 마커
                └── RadiusCircle.tsx     # 100m GeoJSON 원
```

---

## 실행 방법

### 1. DB (PostGIS)
```bash
docker compose up -d
docker compose ps   # Status: healthy 확인
```

### 2. Backend
```bash
cd backend
./gradlew bootRun
curl http://localhost:8080/api/health   # → OK
```

### 3. Frontend
```bash
# 최초 1회: .env.local 설정
cp frontend/.env.local.example frontend/.env.local
# NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxxx 입력 (https://account.mapbox.com/access-tokens/)

cd frontend
npm install
npm run dev     # http://localhost:3000
```

---

## DB 접속 정보

| 항목 | 값 |
|------|----|
| Host | localhost:5432 |
| Database | hansel_db |
| Username | hansel |
| Password | hansel |
| JDBC URL | jdbc:postgresql://localhost:5432/hansel_db |

application.yml: `spring.jpa.hibernate.ddl-auto=update` — 서버 기동 시 스키마 자동 생성/갱신.

---

## REST API

### POST /api/posts — 게시글 작성
```json
// Request Body
{
  "content": "근처 카페 분위기 좋네요",
  "author": "홍길동",
  "imageUrl": "https://...",   // optional
  "latitude": 37.5665,
  "longitude": 126.9780
}

// Response 201
{
  "id": 1,
  "content": "...",
  "author": "홍길동",
  "imageUrl": null,
  "createdAt": "2026-03-31T12:00:00",
  "latitude": 37.5665,
  "longitude": 126.9780
}
```

### GET /api/posts/nearby — 반경 100m 게시글 조회
```
GET /api/posts/nearby?latitude=37.5665&longitude=126.9780

// Response 200 — 최신순 정렬
[{ "id": 1, ... }, ...]
```

### GET /api/health
```
→ 200 OK "OK"
```

---

## 핵심 구현 패턴

### 1. 공간 좌표 규칙 (중요)
- **JTS (Java)**: `new Coordinate(longitude, latitude)` — X=경도, Y=위도
- **PostGIS**: `ST_MakePoint(longitude, latitude)` — 동일하게 경도 먼저
- **PostResponse**: `getX()` = 경도, `getY()` = 위도로 역변환
- **SRID 4326** = WGS 84 (GPS 표준 좌표계). 모든 공간 데이터에 통일 적용.

### 2. PostGIS 100m 반경 쿼리
```sql
WHERE ST_DWithin(
    location::geography,
    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
    100
)
```
- `::geography` 캐스팅이 필수 — `geometry` 타입은 단위가 도(degree)이므로 미터 계산 불가
- `ST_DWithin`은 GIST 공간 인덱스를 활용하므로 `ST_Distance`보다 성능 우수

### 3. Frontend: mapbox-gl SSR 방지
```tsx
// page.tsx
const MainMap = dynamic(() => import('@/components/Map/MainMap'), { ssr: false });
```
mapbox-gl은 WebGL/Canvas 등 브라우저 전용 API를 사용하므로 반드시 CSR로 렌더링.
`next.config.ts`에 `transpilePackages: ["mapbox-gl"]`도 함께 설정.

### 4. 100m 원을 GeoJSON으로 변환 (RadiusCircle.tsx)
```typescript
// 위도 보정이 핵심 — 경도 1도의 실제 거리는 위도에 따라 달라짐
deltaLat = radiusMeters / 110_540
deltaLng = radiusMeters / (111_320 * Math.cos(latitude * Math.PI / 180))
```
64개 점으로 원을 근사하여 GeoJSON Polygon으로 Mapbox Source에 전달.

### 5. Mapbox POI 레이어 숨김
```typescript
// MainMap.tsx — onLoad 콜백에서 처리
['poi-label', 'transit-label', 'airport-label', 'road-label', 'waterway-label']
  .forEach(id => map.setLayoutProperty(id, 'visibility', 'none'));
```
지도 스타일: `mapbox://styles/mapbox/light-v11`

### 6. Post 엔티티 핵심 필드
```java
@Column(columnDefinition = "geometry(Point, 4326)")
private Point location;   // org.locationtech.jts.geom.Point

@CreatedDate
@Column(updatable = false)
private LocalDateTime createdAt;   // @EnableJpaAuditing 으로 자동 설정
```

---

## 환경 변수

### Frontend (.env.local)
| 변수 | 설명 | 기본값 |
|------|------|--------|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox 액세스 토큰 (pk.* 형식) | 없음 (필수) |
| `NEXT_PUBLIC_API_BASE` | 백엔드 API URL | http://localhost:8080 |

### Mapbox 토큰 발급
https://account.mapbox.com/access-tokens/ — 무료 플랜으로 발급 가능.

---

## 패키지 주요 의존성

### Backend (build.gradle)
```gradle
implementation 'org.springframework.boot:spring-boot-starter-web'
implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
implementation 'org.springframework.boot:spring-boot-starter-validation'
implementation 'org.hibernate.orm:hibernate-spatial'
implementation 'org.locationtech.jts:jts-core:1.19.0'
runtimeOnly 'org.postgresql:postgresql'
compileOnly 'org.projectlombok:lombok'
```

### Frontend (package.json)
```json
"framer-motion": "^11.18.2"
"mapbox-gl": "^2.15.0"
"react-map-gl": "^7.1.7"
"lucide-react": "^0.468.0"
"next": "14.2.29"
```

---

## 경로 alias

Frontend에서 `@/`는 `src/`를 가리킴 (tsconfig.json paths 설정).
```typescript
import { Post } from '@/types/post';
import { useGeolocation } from '@/hooks/useGeolocation';
```
