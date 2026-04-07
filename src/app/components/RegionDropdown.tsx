import { useState, useRef, useEffect } from 'react';

interface RegionOption {
  id: string;
  name: string;
}

interface RegionDropdownProps {
  regions: RegionOption[];
  value: string | null;
  onChange: (regionId: string) => void;
  placeholder?: string;
  autoDisplayName?: string; // 자동 순회 중 표시할 지역명
}

export function RegionDropdown({ regions, value, onChange, placeholder = '전체 보기', autoDisplayName }: RegionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [triggerWidth, setTriggerWidth] = useState<number | null>(null);

  const selectedLabel = value ? regions.find(r => r.id === value)?.name || placeholder : (autoDisplayName || placeholder);
  const isSelected = !!value;
  const isAutoDisplay = !value && !!autoDisplayName;

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as EventListener);
    };
  }, [isOpen]);

  // 열릴 때 선택된 항목으로 스크롤
  useEffect(() => {
    if (isOpen && listRef.current && value) {
      const selectedEl = listRef.current.querySelector(`[data-value="${value}"]`) as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen, value]);

  // 트리거 버튼의 너비를 저장
  useEffect(() => {
    if (triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [isOpen]);

  const handleSelect = (regionId: string) => {
    onChange(regionId);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex items-center shrink-0 flex-1 md:inline-flex md:flex-none md:shrink-0">
      {/* 트리거 버튼 — 레퍼런스 스타일: 보더 박스 */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(prev => !prev)}
        className="region-dropdown-trigger-md flex items-center justify-between cursor-pointer outline-none transition-all duration-200 w-full md:w-auto"
        style={{
          minWidth: '120px',
          padding: '10px 14px 10px 18px',
          border: isOpen ? '2px solid #002BFF' : '2px solid #d1d5db',
          borderRadius: '6px',
          background: '#fff',
          color: isSelected || isAutoDisplay ? '#1f2937' : '#9ca3af',
          fontWeight: 600,
          fontSize: '14px',
        }}
      >
        <div className="flex items-center justify-center flex-1">
          <span className={isAutoDisplay ? 'transition-opacity duration-300' : ''}>{selectedLabel}</span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={isOpen ? '#002BFF' : '#9ca3af'}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 ml-2 transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* 드롭다운 목록 */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 z-50 bg-white overflow-hidden"
          style={{
            width: triggerWidth ? `${triggerWidth}px` : '100%',
            borderLeft: '2px solid #d1d5db',
            borderRight: '2px solid #d1d5db',
            borderBottom: '2px solid #d1d5db',
            borderRadius: '0 0 6px 6px',
            animation: 'regionDropdownSlide 0.15s ease-out',
          }}
        >
          <div ref={listRef} className="max-h-[320px] overflow-y-auto region-dropdown-scroll">
            {/* 전체 보기 옵션 */}
            <button
              onClick={() => handleSelect('')}
              className="region-dropdown-item w-full text-left cursor-pointer transition-colors duration-150 whitespace-nowrap"
              style={{
                padding: '13px 18px',
                fontSize: '14px',
                color: !value ? '#002BFF' : '#374151',
                fontWeight: !value ? 700 : 400,
                backgroundColor: !value ? '#f0f5ff' : 'transparent',
                borderBottom: '1px solid #f0f0f0',
              }}
              onMouseEnter={(e) => {
                if (value) e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                if (value) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span className="flex items-center gap-2 whitespace-nowrap">
                <span>전체 보기</span>
                <span className="text-[10px] text-gray-400" style={{ fontWeight: 400 }}>가나다순</span>
              </span>
            </button>

            {/* 지역 목록 */}
            {regions.map((region, idx) => {
              const isActive = value === region.id;
              const isLast = idx === regions.length - 1;
              return (
                <button
                  key={region.id}
                  data-value={region.id}
                  onClick={() => handleSelect(region.id)}
                  className="region-dropdown-item w-full text-left cursor-pointer transition-colors duration-150"
                  style={{
                    padding: '13px 18px',
                    fontSize: '14px',
                    color: isActive ? '#002BFF' : '#374151',
                    fontWeight: isActive ? 700 : 400,
                    backgroundColor: isActive ? '#f0f5ff' : 'transparent',
                    borderBottom: isLast ? 'none' : '1px solid #f0f0f0',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isActive ? '#f0f5ff' : 'transparent';
                  }}
                >
                  {region.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 스타일 */}
      <style>{`
        @keyframes regionDropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (min-width: 768px) {
          .region-dropdown-trigger-md {
            min-width: 180px !important;
          }
        }
        .region-dropdown-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .region-dropdown-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .region-dropdown-scroll::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .region-dropdown-scroll::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}