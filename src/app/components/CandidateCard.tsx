import { useState, useCallback, useRef, useLayoutEffect } from 'react';
import type { Candidate } from '../data/candidates';

// sm: 7~9인(3행), md: 4~6인(2행), lg: 1~3인
type CardSize = 'sm' | 'md' | 'lg';

interface CandidateCardProps {
  candidate: Candidate;
  onClick: () => void;
  cardSize?: CardSize;
  /** 부모가 관리하는 플립 상태 (터치 디바이스에서 한 카드만 뒤집기) */
  flippedCardId?: string;
  onFlipCard?: (candidateId: string) => void;
}

/**
 * 컨테이너 높이에 맞춰 폰트 크기를 동기적으로 축소하는 컴포넌트.
 * React 상태 업데이트 없이 DOM을 직접 조작하여 깜빡임/흔들림 방지.
 */
function AutoFitText({
  children,
  baseFontSize,
  minFontSize,
  className,
  style,
}: {
  children: React.ReactNode;
  baseFontSize: number;
  minFontSize: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const fittedRef = useRef(false);
  const computedFsRef = useRef(baseFontSize);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    // 이미 피팅된 상태이면 재계산하지 않음
    if (fittedRef.current) return;

    // 동기적으로 폰트 크기 조정 (브라우저 페인트 전)
    let fs = baseFontSize;
    outer.style.fontSize = `${fs}px`;

    // 최대 반복 횟수 제한 (안전장치)
    const maxIter = Math.ceil((baseFontSize - minFontSize) / 0.5) + 1;
    for (let i = 0; i < maxIter; i++) {
      if (inner.scrollHeight <= outer.clientHeight + 1 || fs <= minFontSize) {
        break;
      }
      fs = Math.max(minFontSize, fs - 0.5);
      outer.style.fontSize = `${fs}px`;
    }
    computedFsRef.current = fs;
    fittedRef.current = true;
  });

  // children이나 크기 설정이 바뀌면 다시 피팅
  useLayoutEffect(() => {
    fittedRef.current = false;
    computedFsRef.current = baseFontSize;
  }, [children, baseFontSize, minFontSize]);

  return (
    <div
      ref={outerRef}
      className={className}
      style={{ ...style, overflow: 'hidden', fontSize: `${computedFsRef.current}px` }}
    >
      <div ref={innerRef}>
        {children}
      </div>
    </div>
  );
}

export function CandidateCard({ candidate, onClick, cardSize = 'lg', flippedCardId, onFlipCard }: CandidateCardProps) {
  const [localHovered, setLocalHovered] = useState(false);
  const isTouchRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isCompact = cardSize === 'sm' || cardSize === 'md';
  const isTablet = cardSize === 'md';

  // 부모가 flippedCardId를 관리하면 그것을 사용, 아니면 로컬 상태 사용
  const isHovered = flippedCardId !== undefined ? flippedCardId === candidate.id : localHovered;
  const setIsHovered = useCallback((val: boolean) => {
    if (flippedCardId !== undefined && onFlipCard) {
      onFlipCard(val ? candidate.id : '');
    } else {
      setLocalHovered(val);
    }
  }, [flippedCardId, onFlipCard, candidate.id]);

  // 터치 디바이스 감지 및 플립/클릭 처리
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isTouchRef.current = true;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = Math.abs(touch.clientX - touchStartRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartRef.current.y);
    touchStartRef.current = null;

    if (dx > 10 || dy > 10) return;

    e.preventDefault();

    if (!isHovered) {
      setIsHovered(true);
    } else {
      onClick();
    }
  }, [isHovered, onClick]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isTouchRef.current) {
      isTouchRef.current = false;
      return;
    }
    onClick();
  }, [onClick]);

  const handleMouseEnter = useCallback(() => {
    if (!isTouchRef.current) setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!isTouchRef.current) setIsHovered(false);
  }, []);

  // === 앞면 스타일 ===
  const frontPadding = cardSize === 'sm' ? 'px-3 py-2.5'
    : cardSize === 'md' ? 'px-3 py-[10px]'
    : 'px-5 py-3';
  const photoMb = cardSize === 'sm' ? 'mb-1.5'
    : cardSize === 'md' ? 'mb-[6px]'
    : 'mb-2';
  const nameMb = cardSize === 'sm' ? 'mb-0.5'
    : cardSize === 'md' ? 'mb-[2px]'
    : 'mb-0.5';
  const catchphraseMb = cardSize === 'sm' ? 'mb-1'
    : cardSize === 'md' ? 'mb-[4px]'
    : 'mb-2';
  const nameSize = cardSize === 'sm' ? 'text-[20px]'
    : cardSize === 'md' ? 'text-[22px]'
    : 'text-[17px]';
  const catchphraseSize = cardSize === 'sm' ? 'text-[12px]'
    : cardSize === 'md' ? 'text-[13px]'
    : 'text-[13px]';
  const catchphraseMinH = cardSize === 'sm' ? 'min-h-[2.8em]'
    : cardSize === 'md' ? 'min-h-[2.4em]'
    : 'min-h-[2.8em]';

  // 사진 크기 (cardSize별)
  const photoSize = cardSize === 'sm' ? 100
    : cardSize === 'md' ? 105
    : 110;

  // === 뒷면 스타일 ===
  const backPadding = cardSize === 'sm' ? 'p-2.5'
    : cardSize === 'md' ? 'p-[10px]'
    : 'p-3';
  const pledgeP = cardSize === 'sm' ? 'p-2.5'
    : cardSize === 'md' ? 'p-2.5'
    : 'p-2.5';
  const backBadgeSize = cardSize === 'sm' ? 'w-5 h-5'
    : cardSize === 'md' ? 'w-5 h-5'
    : 'w-[18px] h-[18px]';
  const backTitleSize = cardSize === 'sm' ? 'text-[13px]'
    : cardSize === 'md' ? 'text-[14px]'
    : 'text-[13px]';
  const backSectionMb = cardSize === 'sm' ? 'mb-1'
    : cardSize === 'md' ? 'mb-1'
    : 'mb-1';
  const backBtnClass = cardSize === 'sm' ? 'px-3 h-[26px] text-[11px]'
    : cardSize === 'md' ? 'px-4 h-[28px] text-[12px]'
    : 'px-6 h-[32px] text-[13px]';

  // 뒷면 본문 기본 / 최소 폰트 크기 (px)
  const backBodyBase = cardSize === 'sm' ? 15
    : cardSize === 'md' ? 13
    : 13;
  const backBodyMin = cardSize === 'sm' ? 9
    : cardSize === 'md' ? 8
    : 8;

  // 버튼 영역: 사이즈별 차등 적용
  const btnBottom = cardSize === 'lg' ? 14 : 8;
  const btnAreaH = cardSize === 'lg' ? 38 : 34;
  const btnGap = cardSize === 'lg' ? 10 : 6;

  return (
    <div
      className="relative cursor-pointer h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      style={{ perspective: '800px', WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: isHovered ? 'rotateY(180deg)' : 'rotateY(0deg)',
          willChange: 'transform',
        }}
      >
        {/* ===== 앞면: 기본 정보 ===== */}
        <div
          className="absolute inset-0 rounded-2xl bg-white shadow-md border border-gray-100 overflow-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className={`flex flex-col items-center h-full ${frontPadding} justify-center`}>
            {/* 사진 + 이름 + 직업을 하나의 그룹으로 묶어 중앙 정렬 */}
            <div className="flex flex-col items-center shrink-0">
              {/* 사진 */}
              <div className={`${photoMb} shrink-0 flex justify-center`}>
                <div
                  className="rounded-full p-[2px]"
                  style={{
                    width: `${photoSize}px`,
                    height: `${photoSize}px`,
                    background: 'linear-gradient(135deg, #43e8d8, #2fa4e7, #003da5)',
                  }}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-white p-[2px]">
                    <div className="relative w-full h-full rounded-full overflow-hidden" style={{ backgroundColor: '#e8ecf2' }}>
                      <img
                        src={candidate.imageUrl}
                        alt={candidate.name}
                        className="w-full h-full rounded-full object-cover"
                        style={{ objectPosition: 'center 15%' }}
                      />
                      <div
                        className="absolute bottom-0 left-0 right-0 h-[30%] rounded-b-full pointer-events-none"
                        style={{ background: 'linear-gradient(to top, rgba(232,236,242,0.6) 0%, transparent 100%)' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 이름 */}
              <h3
                className={`${nameSize} text-gray-900 text-center ${nameMb} shrink-0`}
                style={{ fontWeight: 700 }}
              >
                {candidate.name}
              </h3>

              {/* 직업/경력 */}
              {isTablet ? (
                /* 태블릿: occupation 표시, 2줄 고정 높이 */
                <div
                  className={`${catchphraseSize} text-gray-500 text-center px-1 shrink-0 overflow-hidden`}
                  style={{
                    fontWeight: 400,
                    wordBreak: 'keep-all',
                    overflowWrap: 'break-word',
                    height: '2.4em',
                    lineHeight: '1.2em',
                  }}
                >
                  {candidate.occupation || candidate.catchphrase || ''}
                </div>
              ) : (
                /* 모바일·데스크탑: occupation 표시, 고정 높이로 카드 정렬 통일 */
                <div
                  className={`${catchphraseSize} text-gray-500 text-center px-1 shrink-0 overflow-hidden`}
                  style={{
                    fontWeight: 400,
                    wordBreak: 'keep-all',
                    overflowWrap: 'break-word',
                    height: cardSize === 'lg' ? '2.6em' : '3.6em',
                    lineHeight: '1.3em',
                    display: '-webkit-box',
                    WebkitLineClamp: cardSize === 'lg' ? 2 : 3,
                    WebkitBoxOrient: 'vertical' as const,
                  }}
                >
                  {candidate.occupation || candidate.catchphrase || ''}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== 뒷면: 대표경력 & 대표학력 ===== */}
        <div
          className="absolute inset-0 w-full rounded-2xl overflow-hidden shadow-lg"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div
            className={`w-full h-full flex flex-col ${backPadding}`}
            style={{
              background: 'linear-gradient(160deg, #43e8d8 0%, #2fa4e7 45%, #003da5 100%)',
              paddingBottom: `${btnBottom + btnAreaH + btnGap}px`,
            }}
          >
            {/* 콘텐츠 영역: 2분할 — flex-1 min-h-0로 고정 */}
            <div className={`flex-1 min-h-0 flex flex-col ${cardSize === 'lg' ? 'gap-1.5' : 'gap-1.5'} overflow-hidden`}>
              {/* 대표경력 */}
              <div className={`bg-black/15 rounded-lg ${pledgeP} flex-1 min-h-0 flex flex-col overflow-hidden`}>
                <div className={`flex items-center gap-1 ${backSectionMb} shrink-0`}>
                  <span
                    className={`inline-flex items-center justify-center ${backBadgeSize} rounded text-white shrink-0`}
                    style={{ backgroundColor: 'rgba(255,255,255,0.3)', fontWeight: 700 }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  </span>
                  <span className={`${backTitleSize} text-white`} style={{ fontWeight: 700 }}>
                    대표경력
                  </span>
                </div>
                <AutoFitText
                  baseFontSize={backBodyBase}
                  minFontSize={backBodyMin}
                  className="text-white/90 flex-1 min-h-0"
                  style={{ fontWeight: 400, lineHeight: 1.35 }}
                >
                  {(candidate.career || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex"
                      style={{ marginBottom: '0.25em' }}
                    >
                      <span className="shrink-0" style={{ width: '1em', textAlign: 'left' }}>·</span>
                      <span style={{ flex: 1, wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
                        {item}
                      </span>
                    </div>
                  ))}
                  {(!candidate.career || candidate.career.length === 0) && (
                    <p className="text-white/60">등록된 경력 정보가 없습니다.</p>
                  )}
                </AutoFitText>
              </div>

              {/* 대표학력 */}
              <div className={`bg-black/15 rounded-lg ${pledgeP} flex-1 min-h-0 flex flex-col overflow-hidden`}>
                <div className={`flex items-center gap-1 ${backSectionMb} shrink-0`}>
                  <span
                    className={`inline-flex items-center justify-center ${backBadgeSize} rounded text-white shrink-0`}
                    style={{ backgroundColor: 'rgba(255,255,255,0.3)', fontWeight: 700 }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                  </span>
                  <span className={`${backTitleSize} text-white`} style={{ fontWeight: 700 }}>
                    대표학력
                  </span>
                </div>
                <AutoFitText
                  baseFontSize={backBodyBase}
                  minFontSize={backBodyMin}
                  className="text-white/90 flex-1 min-h-0"
                  style={{ fontWeight: 400, lineHeight: 1.35 }}
                >
                  {(candidate.education || []).map((item, idx) => (
                    <p key={idx} style={{
                      marginBottom: '0.2em',
                      wordBreak: 'keep-all',
                      overflowWrap: 'break-word',
                    }}>
                      {item}
                    </p>
                  ))}
                  {(!candidate.education || candidate.education.length === 0) && (
                    <p className="text-white/60">등록된 학력 정보가 없습니다.</p>
                  )}
                </AutoFitText>
              </div>
            </div>

            {/* 자세히보기 버튼 — absolute 배치로 위치 고정 */}
            <div
              className="absolute left-0 right-0 flex items-center justify-center"
              style={{ bottom: `${btnBottom}px`, height: `${btnAreaH}px` }}
            >
              <span
                className={`inline-flex items-center justify-center gap-1 ${backBtnClass} rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30 transition-colors`}
                style={{ fontWeight: 600, lineHeight: 1 }}
              >
                자세히보기
                {!isCompact && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}