import { useState, useRef, useCallback } from 'react';

interface TabletScrollHintProps {
  children: React.ReactNode;
  /** 이 수 이상일 때 힌트 표시 (기본 7) */
  threshold?: number;
  itemCount: number;
  maxHeight?: string;
  className?: string;
  /** 스크롤 중일 때 호출 (자동 순회 일시정지 연동) */
  onScrollActivity?: () => void;
}

/**
 * 태블릿 전용 스크롤 힌트 래퍼.
 * 후보자가 threshold명 이상이면 전체 영역을 반투명 오버레이로 덮고,
 * 사용자가 스크롤하면 자연스럽게 페이드아웃됩니다.
 *
 * 렌더 중 동기적으로 상태를 갱신하여 후보자가 보이기 전에
 * 반드시 오버레이가 먼저 표시됩니다.
 */
export function TabletScrollHint({
  children,
  threshold = 7,
  itemCount,
  maxHeight = '780px',
  className = '',
  onScrollActivity,
}: TabletScrollHintProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showHint, setShowHint] = useState(() => itemCount >= threshold);

  // 렌더 중 동기적 파생 상태 — useEffect보다 빠르게 반영되어 1프레임 깜빡임 방지
  const [prevItemCount, setPrevItemCount] = useState(itemCount);
  if (prevItemCount !== itemCount) {
    setPrevItemCount(itemCount);
    if (itemCount >= threshold) {
      setShowHint(true);
      // 스크롤 위치도 리셋
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    } else {
      setShowHint(false);
    }
  }

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    // 20px 이상 스크롤하면 힌트 숨김
    if (scrollRef.current.scrollTop > 20) {
      setShowHint(false);
    }
    // 스크롤 활동을 부모에 알림 (자동 순회 일시정지 연장)
    onScrollActivity?.();
  }, [onScrollActivity]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={scrollRef}
        className="overflow-y-auto overflow-x-hidden pr-1 tablet-scroll"
        style={{ maxHeight }}
        onScroll={handleScroll}
      >
        {children}
      </div>

      {/* 전체 오버레이 + 스크롤 안내 */}
      <div
        className="absolute inset-0 flex flex-col justify-center items-center transition-opacity duration-600"
        style={{
          opacity: showHint ? 1 : 0,
          pointerEvents: 'none',
          background: 'rgba(255, 255, 255, 0.82)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          borderRadius: 'inherit',
          zIndex: 10,
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="animate-bounce">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#002BFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 10l5 5 5-5" />
            </svg>
          </div>
          <span
            className="text-[14px] text-gray-600 bg-white/60 px-4 py-1.5 rounded-full"
            style={{ fontWeight: 700 }}
          >
            아래로 스크롤하세요
          </span>
          <span className="text-[12px] text-gray-400 mt-0.5" style={{ fontWeight: 400 }}>
            후보자 {itemCount}명
          </span>
        </div>
      </div>
    </div>
  );
}