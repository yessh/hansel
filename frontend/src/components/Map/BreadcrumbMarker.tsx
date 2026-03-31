'use client';

/**
 * 빵 부스러기 마커 — 동화적인 느낌의 작은 조약돌/부스러기 모양 SVG 아이콘.
 * 따뜻한 호박색 계열로 지도 위에서 자연스럽게 눈에 띄도록 디자인.
 */
export default function BreadcrumbMarker() {
  return (
    <div className="cursor-pointer group" aria-label="게시글 마커">
      <svg
        width="32"
        height="28"
        viewBox="0 0 32 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-md transition-transform duration-200 group-hover:scale-125"
      >
        {/* 조약돌 본체 — 유기적인 불규칙 타원으로 동화적 느낌 */}
        <path
          d="M16 3C22.5 3 29 7.5 27.5 14C26 20 20 25 14.5 25C9 25 3 21 3.5 15C4 9 9.5 3 16 3Z"
          fill="#B45309"
        />
        {/* 하이라이트 — 입체감 */}
        <ellipse
          cx="12"
          cy="10"
          rx="4.5"
          ry="2.5"
          fill="white"
          opacity="0.22"
          transform="rotate(-25 12 10)"
        />
        {/* 작은 반점 — 빵 부스러기 질감 */}
        <circle cx="19" cy="17" r="1.5" fill="#92400E" opacity="0.6" />
        <circle cx="14" cy="19" r="1" fill="#92400E" opacity="0.5" />
        <circle cx="21" cy="12" r="1" fill="#FDE68A" opacity="0.4" />
      </svg>
    </div>
  );
}
