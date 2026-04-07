interface AppleDotsProps {
  total: number;
  current: number;
  onDotClick?: (index: number) => void;
}

/**
 * Apple 스타일 페이지네이션 dots — SVG 기반 (CSS 간섭 완전 배제)
 */
export function AppleDots({ total, current, onDotClick }: AppleDotsProps) {
  if (total <= 0) return null;

  if (total === 1) {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" style={{ display: 'block' }}>
        <circle cx="6" cy="6" r="4" fill="#003da5" />
      </svg>
    );
  }

  // 5개 이하: 전체 표시
  if (total <= 5) {
    const GAP = 14;
    const svgW = (total - 1) * GAP + 12;

    return (
      <svg
        width={svgW}
        height="14"
        viewBox={`0 0 ${svgW} 14`}
        style={{ display: 'block' }}
      >
        {Array.from({ length: total }, (_, i) => {
          const isActive = i === current;
          const r = isActive ? 4 : 3;
          const cx = 6 + i * GAP;
          const fill = isActive ? '#002BFF' : '#a0a0a0';
          const opacity = isActive ? 1 : 0.4;

          return (
            <circle
              key={i}
              cx={cx}
              cy="7"
              r={r}
              fill={fill}
              opacity={opacity}
              style={{ cursor: onDotClick ? 'pointer' : 'default' }}
              onClick={onDotClick ? () => onDotClick(i) : undefined}
            />
          );
        })}
      </svg>
    );
  }

  // 6개 이상: 슬라이딩 윈도우
  const MAX_VISIBLE = 7;
  const CENTER = Math.floor(MAX_VISIBLE / 2);
  const DOT_GAP = 12;
  const viewW = MAX_VISIBLE * DOT_GAP;

  const slidingStyle = (distance: number) => {
    if (distance === 0) return { r: 4, opacity: 1 };
    if (distance === 1) return { r: 3, opacity: 0.5 };
    if (distance === 2) return { r: 2.25, opacity: 0.3 };
    if (distance === 3) return { r: 1.5, opacity: 0.15 };
    return { r: 0, opacity: 0 };
  };

  const offsetX = CENTER * DOT_GAP - current * DOT_GAP;

  return (
    <svg
      width={viewW}
      height="14"
      viewBox={`0 0 ${viewW} 14`}
      style={{ display: 'block', overflow: 'hidden' }}
    >
      <g transform={`translate(${offsetX}, 0)`} style={{ transition: 'transform 0.3s ease-out' }}>
        {Array.from({ length: total }, (_, i) => {
          const isActive = i === current;
          const dist = Math.abs(i - current);
          const { r, opacity } = slidingStyle(dist);
          if (r === 0) return null;

          const cx = DOT_GAP / 2 + i * DOT_GAP;
          const fill = isActive ? '#002BFF' : '#a0a0a0';

          return (
            <circle
              key={i}
              cx={cx}
              cy="7"
              r={r}
              fill={fill}
              opacity={opacity}
              style={{ cursor: onDotClick ? 'pointer' : 'default' }}
              onClick={onDotClick ? () => onDotClick(i) : undefined}
            />
          );
        })}
      </g>
    </svg>
  );
}
