import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';

interface FloatingButtonsProps {
  footerRef?: React.RefObject<HTMLElement | null>;
  onBack?: () => void;
}

export function FloatingButtons({ footerRef, onBack }: FloatingButtonsProps) {
  const navigate = useNavigate();
  const [showTop, setShowTop] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(24);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const rafRef = useRef<number | null>(null);

  // 투표일까지 D-day 계산 (한국 시간 KST 기준)
  const getKstDday = () => {
    const now = new Date();
    const kstOffset = 9 * 60; // KST = UTC+9
    const kstNow = new Date(now.getTime() + (kstOffset + now.getTimezoneOffset()) * 60000);
    const kstToday = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate());
    const electionDate = new Date(2026, 5, 3); // 2026-06-03 (month is 0-based)
    return Math.ceil((electionDate.getTime() - kstToday.getTime()) / (1000 * 60 * 60 * 24));
  };
  const dDay = getKstDday();

  const FOOTER_GAP = 16; // 푸터 위 여백

  // RAF 기반 위치 계산 - 매 프레임 정확한 위치 계산
  const updatePosition = useCallback(() => {
    // zoom 보정: CSS zoom이 적용된 경우, getBoundingClientRect()와 window.innerHeight는
    // 모두 screen pixels이지만, style.bottom은 CSS pixels (zoom 배율 적용됨)
    const zoom = parseFloat(document.documentElement.style.zoom) || 1;
    const isMobile = window.innerWidth < 768;
    // 반응형 gap: 모바일 12px, 태블릿 14px, 데스크탑 16px (CSS px 기준)
    const responsiveGap = isMobile ? 12 : (window.innerWidth < 1024 ? 14 : 16);
    const baseBottom = responsiveGap;

    setShowTop(window.scrollY > 300);

    // 스크롤바 너비 계산 (fixed 요소와 flow 요소의 container 정렬 보정)
    const sbWidth = window.innerWidth - document.documentElement.clientWidth;
    setScrollbarWidth(sbWidth);

    if (footerRef?.current) {
      const footerRect = footerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // 푸터의 상단이 뷰포트 안에 보이는 경우
      if (footerRect.top < viewportHeight) {
        // screen px 거리를 CSS px로 변환 후 gap 추가
        const distanceFromBottom = (viewportHeight - footerRect.top) / zoom;
        const neededBottom = distanceFromBottom + responsiveGap;
        setBottomOffset(Math.max(baseBottom, neededBottom));
      } else {
        setBottomOffset(baseBottom);
      }
    } else {
      setBottomOffset(baseBottom);
    }

    rafRef.current = requestAnimationFrame(updatePosition);
  }, [footerRef]);

  useEffect(() => {
    // RAF 루프 시작
    rafRef.current = requestAnimationFrame(updatePosition);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [updatePosition]);

  const scrollToTop = () => {
    // CSS zoom 환경에서도 확실하게 최상단 이동
    // 먼저 즉시 이동 후 smooth scroll 시도 (브라우저가 smooth를 지원하면 부드럽게 이동)
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (document.scrollingElement) {
      document.scrollingElement.scrollTop = 0;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className="fixed z-50 left-0 right-0 pointer-events-none"
      style={{
        bottom: `${bottomOffset}px`,
        transition: 'bottom 0.15s ease-out',
        /* 스크롤바 너비만큼 우측 패딩 → page flow container와 정렬 일치 */
        paddingRight: scrollbarWidth > 0 ? `${scrollbarWidth}px` : undefined,
        /* iOS Safari: 터치 이벤트가 이 컨테이너를 통과하도록 보장 */
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div
        className="container mx-auto px-4 flex items-center justify-between"
      >
        {/* 좌측: 투표일 D-day 배너 (클릭 비활성) */}
        <div
          className="pointer-events-auto flex items-center gap-2 px-5 h-[48px] md:h-[52px] rounded-full shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #43e8d8 0%, #2fa4e7 50%, #003da5 100%)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="text-[13px] md:text-[14px] text-white" style={{ fontWeight: 700 }}>
            [D-{dDay}] 지방선거 투표일
          </span>
        </div>

        {/* 우측: TOP + 되돌아가기 (가로 일렬) */}
        <div className="pointer-events-auto flex flex-row items-center gap-2">
          {/* TOP 버튼 (왼쪽) */}
          <button
            onClick={scrollToTop}
            className="w-[48px] h-[48px] md:w-[52px] md:h-[52px] rounded-full shadow-lg cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-xl flex flex-col items-center justify-center text-white"
            style={{
              backgroundColor: '#1a2a4a',
              opacity: showTop ? 1 : 0.4,
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
            title="맨 위로"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
            <span className="text-[11px] md:text-[12px]" style={{ fontWeight: 800, lineHeight: 1 }}>TOP</span>
          </button>

          {/* 되돌아가기 화살표 (오른쪽) */}
          <button
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                navigate(-1);
              }
              // 페이지 전환 후 항상 상단으로 스크롤
              // requestAnimationFrame으로 React Router 네비게이션 완료 후 실행
              requestAnimationFrame(() => {
                window.scrollTo({ top: 0 });
                if (document.scrollingElement) {
                  document.scrollingElement.scrollTop = 0;
                }
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
              });
            }}
            className="w-[48px] h-[48px] md:w-[52px] md:h-[52px] rounded-full shadow-lg cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-xl flex items-center justify-center text-white"
            style={{
              backgroundColor: '#002BFF',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
            title="이전 페이지"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}