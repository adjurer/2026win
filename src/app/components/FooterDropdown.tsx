import { useState, useRef, useEffect } from 'react';

interface LinkOption {
  label: string;
  url: string;
}

const RELATED_SITES: LinkOption[] = [
  { label: '더불어민주당', url: 'https://www.minjoo.kr' },
  { label: '국회', url: 'https://www.assembly.go.kr' },
];

export function FooterDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [triggerWidth, setTriggerWidth] = useState<number | null>(null);

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

  // 트리거 버튼의 너비를 저장
  useEffect(() => {
    if (triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [isOpen]);

  const handleSelect = (url: string) => {
    setIsOpen(false);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div ref={containerRef} className="relative inline-flex shrink-0">
      {/* 트리거 버튼 — RegionDropdown과 동일한 스타일 */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center justify-between cursor-pointer outline-none transition-all duration-200"
        style={{
          minWidth: '120px',
          padding: '10px 14px 10px 18px',
          border: isOpen ? '2px solid #002BFF' : '2px solid #d1d5db',
          borderRadius: '6px',
          background: '#fff',
          color: '#9ca3af',
          fontWeight: 600,
          fontSize: '14px',
        }}
      >
        <div className="flex items-center justify-center flex-1">
          <span>연관 사이트</span>
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

      {/* 드롭다운 목록 — 위로 열림 */}
      {isOpen && (
        <div
          className="absolute bottom-full left-0 mb-1 z-50 bg-white overflow-hidden"
          style={{
            width: triggerWidth ? `${triggerWidth}px` : '100%',
            borderLeft: '2px solid #d1d5db',
            borderRight: '2px solid #d1d5db',
            borderTop: '2px solid #d1d5db',
            borderRadius: '6px 6px 0 0',
            animation: 'footerDropdownSlide 0.15s ease-out',
          }}
        >
          <div className="max-h-[320px] overflow-y-auto footer-dropdown-scroll">
            {RELATED_SITES.map((site, idx) => {
              const isLast = idx === RELATED_SITES.length - 1;
              return (
                <button
                  key={site.url}
                  onClick={() => handleSelect(site.url)}
                  className="w-full text-left cursor-pointer transition-colors duration-150"
                  style={{
                    padding: '13px 18px',
                    fontSize: '14px',
                    color: '#374151',
                    fontWeight: 400,
                    backgroundColor: 'transparent',
                    borderBottom: isLast ? 'none' : '1px solid #f0f0f0',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {site.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 스타일 */}
      <style>{`
        @keyframes footerDropdownSlide {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .footer-dropdown-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .footer-dropdown-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .footer-dropdown-scroll::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .footer-dropdown-scroll::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}