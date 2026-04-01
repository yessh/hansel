# Hänsel (헨젤) — CLAUDE.md

위치 기반 소셜 서비스. 사용자의 현재 위치에서 **반경 100m 이내**에 작성된 게시글(빵 부스러기)만 지도 위에서 볼 수 있는 공간적 SNS.

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| Backend | Java 21, Spring Boot 3.4.4, Gradle 8.8 |
| ORM / DB | Spring Data JPA, Hibernate Spatial, PostgreSQL + PostGIS 3.4 |
| Frontend | Next.js 14.2 (App Router), TypeScript 5, Tailwind CSS 3.4 |
| 지도 | Naver Maps SDK + react-naver-maps 0.1.5 |
| 인증 | Kakao OAuth 2.0 + JWT (JJWT 0.12.6) |
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
│       │   ├── config/
│       │   │   └── WebClientConfig.java        # RestClient bean (Kakao API)
│       │   ├── controller/
│       │   │   ├── HealthController.java        # GET /api/health
│       │   │   ├── PostController.java          # POST /api/posts, GET /api/posts/nearby, /my
│       │   │   └── AuthController.java          # GET /api/auth/kakao/callback, POST /refresh, GET /me
│       │   ├── domain/
│       │   │   ├── Post.java                    # JPA 엔티티, geometry(Point,4326), ManyToOne User
│       │   │   ├── User.java                    # Kakao OAuth 유저 (kakaoId, nickname, profileImageUrl)
│       │   │   └── RefreshToken.java            # JWT 리프레시 토큰 (OneToOne User, expiry)
│       │   ├── dto/
│       │   │   ├── PostCreateRequest.java       # record, @NotBlank/@NotNull 검증
│       │   │   ├── PostResponse.java            # record, from(Post) 팩토리 메서드
│       │   │   ├── AuthResponse.java            # record, 중첩 UserDto
│       │   │   ├── KakaoUserInfo.java           # Kakao API 응답 파싱
│       │   │   └── RefreshRequest.java          # 토큰 갱신 요청
│       │   ├── repository/
│       │   │   ├── PostRepository.java          # ST_DWithin 네이티브 쿼리, findByUserId
│       │   │   ├── UserRepository.java          # findByKakaoId
│       │   │   └── RefreshTokenRepository.java  # findByUser, findByToken
│       │   ├── security/
│       │   │   ├── JwtProvider.java             # JWT 생성/검증 (access 1h, refresh 7d)
│       │   │   ├── JwtAuthenticationFilter.java # Bearer 토큰 추출, SecurityContext 설정
│       │   │   └── SecurityConfig.java          # 공개 경로 설정, CORS, Stateless
│       │   └── service/
│       │       ├── PostService.java             # GeometryFactory(SRID=4326)
│       │       ├── AuthService.java             # Kakao OAuth 플로우, 토큰 갱신
│       │       └── KakaoOAuthService.java       # Kakao API v2/user/me 호출
│       └── resources/
│           ├── application.yml
│           └── application-local.yml            # Kakao/JWT 시크릿 (gitignore)
│
└── frontend/                   # Next.js
    ├── package.json
    ├── next.config.js           # reactStrictMode: true
    ├── tailwind.config.ts
    ├── .env.local.example
    └── src/
        ├── app/
        │   ├── layout.tsx               # RootLayout, lang="ko"
        │   ├── page.tsx                 # dynamic(MainMap, { ssr: false })
        │   ├── providers.tsx            # NavermapsProvider + AuthProvider
        │   ├── globals.css              # Tailwind directives
        │   ├── auth/kakao/page.tsx      # Kakao OAuth 콜백 처리
        │   └── my-posts/
        │       ├── page.tsx             # 내가 쓴 글 목록 (Nominatim 역지오코딩)
        │       └── [id]/page.tsx        # 게시글 상세
        ├── types/
        │   ├── post.ts                  # Post interface
        │   └── auth.ts                  # AuthUser, AuthTokens, AuthState
        ├── contexts/
        │   └── AuthContext.tsx          # 토큰/유저 localStorage 저장, 자동 갱신
        ├── hooks/
        │   └── useGeolocation.ts        # watchPosition 실시간 추적
        └── components/
            ├── PostDrawer.tsx           # Framer Motion 하단 시트 (게시글 조회)
            ├── PostCreateDrawer.tsx     # 게시글 작성 폼 (300자 제한)
            ├── LoginBottomSheet.tsx     # Kakao 로그인 바텀시트
            └── Map/
                ├── MainMap.tsx          # 지도 메인 컴포넌트 (Naver Maps)
                └── BreadcrumbMarker.tsx # SVG 마커 HTML 문자열 (빵부스러기/현재위치)
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

> `application-local.yml`에 Kakao OAuth 키와 JWT 시크릿 설정 필요 (아래 환경 변수 참고)

### 3. Frontend
```bash
# 최초 1회: .env.local 설정
cp frontend/.env.local.example frontend/.env.local
# 환경 변수 입력 (아래 환경 변수 섹션 참고)

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

`spring.jpa.hibernate.ddl-auto=update` — 서버 기동 시 스키마 자동 생성/갱신.

**테이블**: `users`, `post`, `refresh_token`

---

## REST API

### 인증

#### GET /api/auth/kakao/callback — Kakao OAuth 콜백
```
GET /api/auth/kakao/callback?code=xxxx

// Response 200
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "id": 1, "nickname": "홍길동", "profileImageUrl": "https://..." }
}
```

#### POST /api/auth/refresh — 토큰 갱신
```json
// Request Body
{ "refreshToken": "eyJ..." }

// Response 200 — 새 accessToken 반환
{ "accessToken": "eyJ...", "refreshToken": "eyJ...", "user": { ... } }
```

#### GET /api/auth/me — 현재 유저 정보 (인증 필요)
```
Authorization: Bearer {accessToken}
→ 200 { "id": 1, "nickname": "홍길동", "profileImageUrl": "..." }
```

### 게시글

#### POST /api/posts — 게시글 작성 (인증 필요)
```json
// Request Body
{
  "content": "근처 카페 분위기 좋네요",
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

#### GET /api/posts/nearby — 반경 100m 게시글 조회 (공개)
```
GET /api/posts/nearby?latitude=37.5665&longitude=126.9780
→ 200 — 최신순 정렬 배열
```

#### GET /api/posts/my — 내가 쓴 글 조회 (인증 필요)
```
Authorization: Bearer {accessToken}
→ 200 — 최신순 정렬 배열
```

#### GET /api/posts/{id} — 게시글 상세 (인증 필요)
```
Authorization: Bearer {accessToken}
→ 200 PostResponse
```

#### GET /api/health
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

### 3. Frontend: Naver Maps SSR 방지
```tsx
// page.tsx
const MainMap = dynamic(() => import('@/components/Map/MainMap'), { ssr: false });
```
Naver Maps SDK는 브라우저 전용 API를 사용하므로 반드시 CSR로 렌더링.
`providers.tsx`에서 `NavermapsProvider`로 전체 앱을 감싸야 함.

### 4. 인증 플로우 (Kakao OAuth + JWT)
1. 프론트: `https://kauth.kakao.com/oauth/authorize?client_id=...&redirect_uri=...&response_type=code`로 리다이렉트
2. Kakao → `/api/auth/kakao/callback?code=xxx` 콜백
3. 백엔드: code → Kakao access token → 유저 정보 조회 → DB upsert → JWT 발급
4. 프론트: `AuthContext`에서 토큰/유저를 localStorage에 저장
5. 만료된 access token은 refresh token으로 자동 갱신 (AuthContext 마운트 시 체크)

### 5. JWT 토큰 만료
- Access Token: 1시간 (3,600,000ms)
- Refresh Token: 7일 (604,800,000ms), DB에 저장

### 6. 보안 설정 (SecurityConfig)
- 공개 경로: `/api/auth/**`, `/api/health`, `/api/posts/nearby`
- 나머지 경로: `Authorization: Bearer {accessToken}` 필요
- CORS: `localhost:3000`만 허용
- Stateless 세션 (no CSRF, no session)

### 7. Post 엔티티 핵심 필드
```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "user_id")
private User user;

@Column(columnDefinition = "geometry(Point, 4326)")
private Point location;   // org.locationtech.jts.geom.Point

@CreatedDate
@Column(updatable = false)
private LocalDateTime createdAt;   // @EnableJpaAuditing 으로 자동 설정
```

### 8. 역지오코딩 (my-posts 페이지)
Nominatim(OpenStreetMap) API로 위경도 → 주소 변환:
```
https://nominatim.openstreetmap.org/reverse?format=json&lat=...&lon=...
```
프리 API이므로 과도한 요청 금지.

---

## 환경 변수

### Backend (application-local.yml)
| 변수 | 설명 |
|------|------|
| `kakao.client-id` | Kakao REST API 키 |
| `kakao.client-secret` | Kakao 앱 시크릿 |
| `jwt.secret` | JWT 서명 키 (Base64 인코딩, 256bit 이상) |

### Frontend (.env.local)
| 변수 | 설명 | 기본값 |
|------|------|--------|
| `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID` | Naver Cloud Platform 클라이언트 ID | 없음 (필수) |
| `NEXT_PUBLIC_KAKAO_CLIENT_ID` | Kakao REST API 키 | 없음 (필수) |
| `NEXT_PUBLIC_API_BASE` | 백엔드 API URL | http://localhost:8080 |

---

## 패키지 주요 의존성

### Backend (build.gradle)
```gradle
implementation 'org.springframework.boot:spring-boot-starter-web'
implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
implementation 'org.springframework.boot:spring-boot-starter-validation'
implementation 'org.springframework.boot:spring-boot-starter-security'
implementation 'org.hibernate.orm:hibernate-spatial'
implementation 'org.locationtech.jts:jts-core:1.19.0'
implementation 'io.jsonwebtoken:jjwt-api:0.12.6'
runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.12.6'
runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.12.6'
runtimeOnly 'org.postgresql:postgresql'
compileOnly 'org.projectlombok:lombok'
```

### Frontend (package.json)
```json
"next": "14.2.29"
"react": "^18"
"framer-motion": "^11.18.2"
"react-naver-maps": "^0.1.5"
"lucide-react": "^0.468.0"

devDependencies:
"@types/navermaps": "^3.9.1"
"typescript": "^5"
"tailwindcss": "^3.4.17"
```

---

## 경로 alias

Frontend에서 `@/`는 `src/`를 가리킴 (tsconfig.json paths 설정).
```typescript
import { Post } from '@/types/post';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuth } from '@/contexts/AuthContext';
```
