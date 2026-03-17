import { useMemo } from 'react';

interface AppleDotsProps {
  total: number;
  current: number;
  onDotClick?: (index: number) => void;
}

/**
 * Apple 스타일 페이지네이션 dots
 *
 * 1인: ● (파란 점 1개)
 * 2인: ● ○ 또는 ○ ● (같은 크기, 파란색만 이동)
 * 3인: ○ ● ○ (가운데 파란, 양옆 회색)
 * 4인: ○ ○ ● ○ (크기 그라데이션 + 중앙 파란)
 * 5인: ∘ ○ ● ○ ∘ (작→중→대→중→작)
 * 6인+: 슬라이딩 윈도우, 활성 도트 항상 중앙 고정
 */
export function AppleDots({ total, current, onDotClick }: AppleDotsProps) {
  // 거리별 크기/투명도 계산
  const getStyle = (distance: number, totalCount: number) => {
    // 2개일 때: 같은 크기
    if (totalCount === 2) {
      return { size: 7, opacity: 0.5 };
    }
    // 3개 이하: 약간의 크기 차이만
    if (totalCount <= 3) {
      if (distance === 0) return { size: 8, opacity: 1 };
      return { size: 6, opacity: 0.45 };
    }
    // 4~5개: 그라데이션
    if (distance === 0) return { size: 8, opacity: 1 };
    if (distance === 1) return { size: 6, opacity: 0.5 };
    if (distance === 2) return { size: 4.5, opacity: 0.3 };
    return { size: 3.5, opacity: 0.2 };
  };

  // 6개 이상: 슬라이딩 윈도우 계산
  const MAX_VISIBLE = 7;
  const CENTER = Math.floor(MAX_VISIBLE / 2); // 3
  const DOT_GAP = 12; // dot center-to-center

  const slidingStyle = (distance: number) => {
    if (distance === 0) return { size: 8, opacity: 1 };
    if (distance === 1) return { size: 6, opacity: 0.5 };
    if (distance === 2) return { size: 4.5, opacity: 0.3 };
    if (distance === 3) return { size: 3, opacity: 0.15 };
    return { size: 0, opacity: 0 };
  };

  if (total <= 0) return null;
  if (total === 1) {
    // 1인: 파란 점 1개
    return (
      <div className="flex items-center justify-center" style={{ height: '12px', minHeight: '12px' }}>
        <div
          className="rounded-full"
          style={{
            width: 8,
            height: 8,
            backgroundColor: '#003da5',
          }}
        />
      </div>
    );
  }

  // 5개 이하: 전체 표시, 크기 그라데이션
  if (total <= 5) {
    return (
      <div className="flex items-center justify-center gap-[6px]" style={{ height: '12px', minHeight: '12px' }}>
        {Array.from({ length: total }, (_, i) => {
          const isActive = i === current;
          const distance = Math.abs(i - current);
          const { size, opacity } = getStyle(distance, total);

          return (
            <button
              key={i}
              onClick={() => onDotClick?.(i)}
              className="cursor-pointer p-0 border-0 rounded-full transition-all duration-300 ease-out"
              style={{
                width: size,
                height: size,
                backgroundColor: isActive ? '#003da5' : '#c4c4c4',
                opacity: isActive ? 1 : opacity,
                minWidth: size,
                flexShrink: 0,
              }}
              aria-label={`${i + 1}페이지`}
              aria-current={isActive ? 'true' : undefined}
            />
          );
        })}
      </div>
    );
  }

  // 6개 이상: 중앙 고정 슬라이딩 윈도우
  const containerWidth = MAX_VISIBLE * DOT_GAP;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: containerWidth,
        height: 14,
        minHeight: 14,
      }}
    >
      <div
        className="absolute top-0 left-0 h-full flex items-center transition-transform duration-300 ease-out"
        style={{
          transform: `translateX(${CENTER * DOT_GAP - current * DOT_GAP}px)`,
          width: total * DOT_GAP,
        }}
      >
        {Array.from({ length: total }, (_, i) => {
          const isActive = i === current;
          const dist = Math.abs(i - current);
          const { size, opacity } = slidingStyle(dist);

          return (
            <button
              key={i}
              onClick={() => onDotClick?.(i)}
              className="absolute top-1/2 cursor-pointer p-0 border-0 rounded-full transition-all duration-300 ease-out"
              style={{
                left: i * DOT_GAP + DOT_GAP / 2,
                width: size,
                height: size,
                transform: 'translate(-50%, -50%)',
                backgroundColor: isActive ? '#003da5' : '#c4c4c4',
                opacity: isActive ? 1 : opacity,
              }}
              aria-label={`${i + 1}페이지`}
              aria-current={isActive ? 'true' : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
