import { useState, useRef, useCallback, useEffect } from 'react';
import { AppleDots } from './AppleDots';

interface CardSwiperProps {
  children: React.ReactNode[];
  /** Card dimensions for the center (active) card */
  cardWidth?: number;
  cardHeight?: number;
  /** Scale of side cards relative to center (0~1) */
  sideScale?: number;
  /** How much side cards overlap inward (px) */
  sideOffset?: number;
  /** How much side cards shift upward (px, positive = up) */
  sideVerticalOffset?: number;
  /** Initial card index */
  initialIndex?: number;
  /** Class for outer container */
  className?: string;
  /** Fade transition (for auto-rotate) */
  fadeIn?: boolean;
  /** Auto-rotate pause/play control */
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  /** Hide built-in dots navigation (for external dots) */
  hideDots?: boolean;
  /** Callback when active card index changes */
  onIndexChange?: (index: number) => void;
  /** Callback fired only on actual user swipe (not programmatic) */
  onUserSwipe?: () => void;
  /** Enable infinite loop */
  infinite?: boolean;
}

export function CardSwiper({
  children,
  cardWidth = 230,
  cardHeight = 330,
  sideScale = 0.78,
  sideOffset = 40,
  sideVerticalOffset = 20,
  initialIndex = 0,
  className = '',
  fadeIn = true,
  isPlaying,
  onTogglePlay,
  hideDots = false,
  onIndexChange,
  onUserSwipe,
  infinite = false,
}: CardSwiperProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; time: number } | null>(null);
  const total = children.length;

  // Reset index when children change (e.g., region switch)
  useEffect(() => {
    setCurrentIndex(0);
    setDragOffset(0);
    if (onIndexChange) onIndexChange(0);
  }, [total]);

  const wrapIndex = useCallback((index: number) => {
    if (!infinite) return Math.max(0, Math.min(total - 1, index));
    return ((index % total) + total) % total;
  }, [total, infinite]);

  const goTo = useCallback((index: number) => {
    const wrapped = wrapIndex(index);
    setCurrentIndex(wrapped);
    setDragOffset(0);
    if (onIndexChange) onIndexChange(wrapped);
  }, [wrapIndex, onIndexChange]);

  const goNext = useCallback(() => {
    if (infinite) {
      goTo(currentIndex + 1);
    } else {
      if (currentIndex < total - 1) goTo(currentIndex + 1);
      else setDragOffset(0);
    }
  }, [currentIndex, total, goTo, infinite]);

  const goPrev = useCallback(() => {
    if (infinite) {
      goTo(currentIndex - 1);
    } else {
      if (currentIndex > 0) goTo(currentIndex - 1);
      else setDragOffset(0);
    }
  }, [currentIndex, total, goTo, infinite]);

  // Touch
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartRef.current = { x: e.touches[0].clientX, time: Date.now() };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragStartRef.current) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    // 수평 스와이프 감지 시 브라우저 기본 스크롤 방지 (세로 흔들림 해결)
    if (Math.abs(dx) > 8) {
      e.preventDefault();
    }
    // 경계에서 저항 (infinite 모드에서는 저항 없음)
    let offset = dx;
    if (!infinite && ((currentIndex === 0 && dx > 0) || (currentIndex === total - 1 && dx < 0))) {
      offset = dx * 0.25;
    }
    if (Math.abs(dx) > 8) {
      setDragOffset(offset);
      setIsDragging(true);
    }
  }, [currentIndex, total, infinite]);

  const handleTouchEnd = useCallback(() => {
    if (!dragStartRef.current) return;
    const elapsed = Date.now() - dragStartRef.current.time;
    const velocity = Math.abs(dragOffset) / Math.max(elapsed, 1);

    if (Math.abs(dragOffset) > 50 || velocity > 0.35) {
      if (dragOffset < 0) goNext();
      else goPrev();
      if (onUserSwipe) onUserSwipe();
    } else {
      setDragOffset(0);
    }
    dragStartRef.current = null;
    setIsDragging(false);
  }, [dragOffset, goNext, goPrev, onUserSwipe]);

  // Mouse drag (for desktop testing)
  const mouseDownRef = useRef(false);
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartRef.current = { x: e.clientX, time: Date.now() };
    mouseDownRef.current = true;
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!mouseDownRef.current) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      let offset = dx;
      if (!infinite && ((currentIndex === 0 && dx > 0) || (currentIndex === total - 1 && dx < 0))) {
        offset = dx * 0.25;
      }
      setDragOffset(offset);
    };
    const handleMouseUp = () => {
      mouseDownRef.current = false;
      const elapsed = Date.now() - (dragStartRef.current?.time || Date.now());
      const velocity = Math.abs(dragOffset) / Math.max(elapsed, 1);
      if (Math.abs(dragOffset) > 50 || velocity > 0.35) {
        if (dragOffset < 0) goNext();
        else goPrev();
        if (onUserSwipe) onUserSwipe();
      } else {
        setDragOffset(0);
      }
      dragStartRef.current = null;
      setIsDragging(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, currentIndex, total, goNext, goPrev, infinite, onUserSwipe]);

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev]);

  // 카드 스타일 계산 (커버플로우)
  const sideCardWidth = cardWidth * sideScale;
  const totalWidth = sideCardWidth + cardWidth + sideCardWidth - sideOffset * 2;

  const getCardStyle = (index: number): React.CSSProperties | null => {
    let diff = index - currentIndex;

    // Infinite mode: wrap diff for shortest visual path
    if (infinite && total > 2) {
      if (diff > total / 2) diff -= total;
      if (diff < -total / 2) diff += total;
    }

    // 보이는 범위: -2 ~ +2 (페이드아웃용)
    if (Math.abs(diff) > 2) return null;

    const isCenter = diff === 0;
    const absDiff = Math.abs(diff);

    // 기본 위치 계산
    let scale = isCenter ? 1 : sideScale * (absDiff === 1 ? 1 : 0.6);
    let opacity = isCenter ? 1 : absDiff === 1 ? 0.7 : 0;
    let zIndex = isCenter ? 10 : absDiff === 1 ? 5 : 1;

    // 중앙 기준 x 위치
    const centerX = totalWidth / 2 - cardWidth / 2;
    let x: number;
    if (isCenter) {
      x = centerX;
    } else if (diff < 0) {
      x = centerX - (cardWidth / 2 + sideCardWidth / 2 - sideOffset) * absDiff;
    } else {
      x = centerX + (cardWidth / 2 + sideCardWidth / 2 - sideOffset) * absDiff;
    }

    // 드래그 오프셋 적용 (모든 카드 함께 이동)
    if (isDragging) {
      x += dragOffset * 0.8;
    }

    return {
      position: 'absolute',
      left: 0,
      top: 0,
      width: cardWidth,
      height: cardHeight,
      transform: `translateX(${x}px) translateY(${(cardHeight - cardHeight * scale) / 2 - sideVerticalOffset * absDiff}px) scale(${scale})`,
      transformOrigin: 'center center',
      transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease',
      opacity,
      zIndex,
      pointerEvents: isCenter ? 'auto' : 'none',
      filter: isCenter ? 'none' : 'brightness(0.92)',
      willChange: 'transform, opacity',
    } as React.CSSProperties;
  };

  if (total === 0) return null;

  return (
    <div
      className={`flex flex-col items-center gap-2 transition-opacity duration-500 ${className}`}
      style={{ opacity: fadeIn ? 1 : 0 }}
    >
      {/* 카드 영역 */}
      <div
        className="relative select-none overflow-visible"
        style={{
          width: totalWidth,
          height: cardHeight,
          touchAction: 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {children.map((child, index) => {
          const style = getCardStyle(index);
          if (!style) return null;
          return (
            <div key={index} style={style}>
              {child}
            </div>
          );
        })}
      </div>

      {/* 네비게이션 — 인스타그램 스타일 도트 */}
      {(!hideDots || onTogglePlay !== undefined) && (
        <div className="flex items-center justify-center gap-3">
          {!hideDots && (
            <AppleDots
              total={total}
              current={currentIndex}
              onDotClick={(idx) => goTo(idx)}
            />
          )}

          {/* 일시정지/재생 버튼 (자동 순회 시) */}
          {onTogglePlay !== undefined && (
            <button
              onClick={onTogglePlay}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-gray-600 cursor-pointer transition-colors hover:bg-gray-50"
              style={{
                borderColor: isPlaying ? '#d1d5db' : '#003da5',
                borderWidth: isPlaying ? '1px' : '2px',
              }}
              aria-label={isPlaying ? '일시정지' : '재생'}
            >
              {isPlaying ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#003da5" stroke="none">
                  <rect x="6" y="4" width="4" height="16" rx="1.5" />
                  <rect x="14" y="4" width="4" height="16" rx="1.5" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#003da5" stroke="none">
                  <polygon points="7,4 21,12 7,20" />
                </svg>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}