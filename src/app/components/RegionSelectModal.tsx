import { useState, useRef, useEffect } from 'react';
import { ALL_REGIONS } from './GyeonggiMap';

interface RegionSelectModalProps {
  isOpen: boolean;
  onSelect: (regionId: string, regionName: string) => void;
  onSkip: () => void;
}

export function RegionSelectModal({ isOpen, onSelect, onSkip }: RegionSelectModalProps) {
  const [selectedRegion, setSelectedRegion] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedLabel = selectedRegion
    ? ALL_REGIONS.find(r => r.id === selectedRegion)?.name || '경기도 시/군 선택'
    : '경기도 시/군 선택';

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as EventListener);
    };
  }, [isDropdownOpen]);

  // 열릴 때 선택된 항목으로 스크롤
  useEffect(() => {
    if (isDropdownOpen && listRef.current && selectedRegion) {
      const el = listRef.current.querySelector(`[data-value="${selectedRegion}"]`) as HTMLElement;
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isDropdownOpen, selectedRegion]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedRegion) return;
    const found = ALL_REGIONS.find(r => r.id === selectedRegion);
    if (found) {
      onSelect(found.id, found.name);
    }
  };

  const handleSelectRegion = (regionId: string) => {
    setSelectedRegion(regionId);
    setIsDropdownOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onSkip} />

      {/* Modal */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-[90%] max-w-[420px] p-8 md:p-10 mx-4">
        {/* Title */}
        <h2 className="text-center text-[20px] md:text-[22px] text-gray-900 mb-2" style={{ fontWeight: 700 }}>
          거주지가 어디시나요?
        </h2>
        <p className="text-center text-[13px] text-gray-500 mb-8" style={{ fontWeight: 400 }}>
          지역을 선택해주세요
        </p>

        {/* Custom Dropdown */}
        <div className="relative mb-6" ref={dropdownRef}>
          {/* 트리거 */}
          <button
            onClick={() => setIsDropdownOpen(prev => !prev)}
            className="w-full flex items-center justify-between cursor-pointer outline-none transition-all duration-200"
            style={{
              padding: '14px 16px',
              border: isDropdownOpen ? '2px solid #003da5' : '2px solid #d1d5db',
              borderRadius: '6px',
              background: '#fff',
              color: selectedRegion ? '#1f2937' : '#9ca3af',
              fontWeight: 500,
              fontSize: '15px',
            }}
          >
            <div className="flex items-center gap-2 flex-1">
              <span>{selectedLabel}</span>
              {!selectedRegion && (
                <span className="text-[10px] text-gray-400 shrink-0" style={{ fontWeight: 400 }}>가나다순</span>
              )}
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isDropdownOpen ? '#003da5' : '#9ca3af'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 transition-transform duration-200"
              style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* 드롭다운 목록 */}
          {isDropdownOpen && (
            <div
              className="absolute top-full left-0 w-full mt-1 z-50 bg-white overflow-hidden"
              style={{
                borderLeft: '2px solid #d1d5db',
                borderRight: '2px solid #d1d5db',
                borderBottom: '2px solid #d1d5db',
                borderRadius: '0 0 6px 6px',
                animation: 'modalDropdownSlide 0.15s ease-out',
              }}
            >
              <div ref={listRef} className="max-h-[240px] overflow-y-auto modal-dropdown-scroll">
                {ALL_REGIONS.map((region, idx) => {
                  const isActive = selectedRegion === region.id;
                  const isLast = idx === ALL_REGIONS.length - 1;
                  return (
                    <button
                      key={region.id}
                      data-value={region.id}
                      onClick={() => handleSelectRegion(region.id)}
                      className="w-full text-left cursor-pointer transition-colors duration-150"
                      style={{
                        padding: '13px 18px',
                        fontSize: '14px',
                        color: isActive ? '#003da5' : '#374151',
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
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={!selectedRegion}
          className="w-full rounded-xl text-white text-[15px] cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg"
          style={{
            height: '52px',
            background: selectedRegion
              ? 'linear-gradient(135deg, #43e8d8 0%, #2fa4e7 60%, #003da5 100%)'
              : '#d1d5db',
            fontWeight: 700,
          }}
        >
          지역 선택
        </button>

        {/* Skip Button */}
        <button
          onClick={onSkip}
          className="w-full mt-3 rounded-xl text-[14px] text-gray-500 bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors"
          style={{ height: '52px', fontWeight: 600 }}
        >
          건너뛰기
        </button>
      </div>

      {/* 스타일 */}
      <style>{`
        @keyframes modalDropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .modal-dropdown-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .modal-dropdown-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .modal-dropdown-scroll::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .modal-dropdown-scroll::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}