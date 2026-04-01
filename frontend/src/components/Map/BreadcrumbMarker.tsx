/**
 * 네이버 지도 Marker의 icon.content에 사용할 HTML 문자열.
 * Tailwind가 아닌 인라인 스타일 + globals.css의 클래스를 사용해
 * 마커 DOM에서도 정상 적용되도록 한다.
 */

/** 빵 부스러기(조약돌) 마커 — 호박색 SVG + hover 확대 */
export const BREADCRUMB_MARKER_HTML = `
<div class="hansel-breadcrumb" style="cursor:pointer;display:inline-block;" aria-label="게시글 마커">
  <svg width="32" height="28" viewBox="0 0 32 28" fill="none" xmlns="http://www.w3.org/2000/svg"
       style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.25));">
    <path d="M16 3C22.5 3 29 7.5 27.5 14C26 20 20 25 14.5 25C9 25 3 21 3.5 15C4 9 9.5 3 16 3Z"
          fill="#B45309"/>
    <ellipse cx="12" cy="10" rx="4.5" ry="2.5" fill="white" opacity="0.22"
             transform="rotate(-25 12 10)"/>
    <circle cx="19" cy="17" r="1.5" fill="#92400E" opacity="0.6"/>
    <circle cx="14" cy="19" r="1" fill="#92400E" opacity="0.5"/>
    <circle cx="21" cy="12" r="1" fill="#FDE68A" opacity="0.4"/>
  </svg>
</div>
`.trim();

/** 내가 쓴 글 마커 — 인디고 조약돌 */
export const OWN_POST_MARKER_HTML = `
<div class="hansel-breadcrumb" style="cursor:pointer;display:inline-block;" aria-label="내 게시글 마커">
  <svg width="32" height="28" viewBox="0 0 32 28" fill="none" xmlns="http://www.w3.org/2000/svg"
       style="filter:drop-shadow(0 2px 5px rgba(79,70,229,0.45));">
    <path d="M16 3C22.5 3 29 7.5 27.5 14C26 20 20 25 14.5 25C9 25 3 21 3.5 15C4 9 9.5 3 16 3Z"
          fill="#4F46E5"/>
    <ellipse cx="12" cy="10" rx="4.5" ry="2.5" fill="white" opacity="0.28"
             transform="rotate(-25 12 10)"/>
    <circle cx="19" cy="17" r="1.5" fill="#3730A3" opacity="0.6"/>
    <circle cx="14" cy="19" r="1" fill="#3730A3" opacity="0.5"/>
    <circle cx="21" cy="12" r="1" fill="#C7D2FE" opacity="0.5"/>
  </svg>
</div>
`.trim();

/** 이미 읽은 글 마커 — 회색 조약돌 (흐릿) */
export const READ_POST_MARKER_HTML = `
<div class="hansel-breadcrumb" style="cursor:pointer;display:inline-block;opacity:0.55;" aria-label="읽은 게시글 마커">
  <svg width="32" height="28" viewBox="0 0 32 28" fill="none" xmlns="http://www.w3.org/2000/svg"
       style="filter:drop-shadow(0 1px 3px rgba(0,0,0,0.15));">
    <path d="M16 3C22.5 3 29 7.5 27.5 14C26 20 20 25 14.5 25C9 25 3 21 3.5 15C4 9 9.5 3 16 3Z"
          fill="#9CA3AF"/>
    <ellipse cx="12" cy="10" rx="4.5" ry="2.5" fill="white" opacity="0.2"
             transform="rotate(-25 12 10)"/>
    <circle cx="19" cy="17" r="1.5" fill="#6B7280" opacity="0.5"/>
    <circle cx="14" cy="19" r="1" fill="#6B7280" opacity="0.4"/>
    <circle cx="21" cy="12" r="1" fill="#E5E7EB" opacity="0.4"/>
  </svg>
</div>
`.trim();

/** 현재 위치 마커 — 파란 점 + 펄스 애니메이션 */
export const CURRENT_LOCATION_MARKER_HTML = `
<div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
  <div class="hansel-ping"
       style="position:absolute;width:32px;height:32px;border-radius:50%;background-color:rgba(99,102,241,0.3);">
  </div>
  <div style="position:relative;width:16px;height:16px;border-radius:50%;background-color:#4F46E5;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);">
  </div>
</div>
`.trim();
