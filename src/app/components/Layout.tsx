import { Outlet, useNavigate, useLocation } from 'react-router';
import { useState, useRef, useEffect } from 'react';
import { FloatingButtons } from './FloatingButtons';
import partyLogo from 'figma:asset/ffbf86217fcfb568b5f498011d4354740553d24a.png';
import gyeonggiSlogan from 'figma:asset/85136cb3804c921bb1531669e125d03a2ac59c5e.png';
import footerLogo from 'figma:asset/2f8708a0a56e2c6a472108300ec146344080a0cf.png';
import { FooterDropdown } from './FooterDropdown';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const footerRef = useRef<HTMLElement>(null);
  const [customBackHandler, setCustomBackHandler] = useState<(() => void) | null>(null);

  // 라우트 변경 시 항상 스크롤 최상단으로 리셋
  useEffect(() => {
    window.scrollTo(0, 0);
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname, location.search]);

  // PC 비율 축소: 1024px ~ DESIGN_WIDTH 구간에서 zoom 적용
  // iOS Safari 등 터치 디바이스에서는 zoom이 터치 좌표를 깨뜨리므로 비활성화
  const DESIGN_WIDTH = 1280;
  const MIN_SCALE_WIDTH = 1024;

  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    const updateZoom = () => {
      const w = window.innerWidth;
      if (w >= MIN_SCALE_WIDTH && w < DESIGN_WIDTH && !isTouchDevice) {
        const zoom = w / DESIGN_WIDTH;
        document.documentElement.style.zoom = String(zoom);
      } else {
        // 터치 디바이스에서는 zoom 속성 자체를 제거하여 iOS Safari 터치 좌표 문제 방지
        document.documentElement.style.removeProperty('zoom');
      }
    };

    updateZoom();
    window.addEventListener('resize', updateZoom);
    return () => {
      document.documentElement.style.removeProperty('zoom');
      window.removeEventListener('resize', updateZoom);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7fa]">
      {/* Header */}
      <header
        className="relative py-3.5 md:py-4 shadow-md z-40"
        style={{ background: 'linear-gradient(135deg, #001a99 0%, #002BFF 50%, #001a99 100%)' }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex-shrink-0">
              <img
                src={partyLogo}
                alt="더불어민주당"
                className="h-7 md:h-10 object-contain brightness-0 invert cursor-pointer"
                onClick={() => navigate('/')}
              />
            </div>

            <div className="flex-1 flex justify-center px-2 md:px-4">
              <img
                src={gyeonggiSlogan}
                alt="당원주권시대 승리하는 경기도당"
                className="h-7 md:h-10 object-contain cursor-pointer brightness-0 invert"
                onClick={() => navigate('/')}
              />
            </div>

            <div className="flex-shrink-0 text-right">
              <div className="flex flex-col items-end leading-none" style={{ width: 'auto' }}>
                <span
                  className="text-white text-[16px] md:text-[20px] block"
                  style={{ fontWeight: 800, textAlign: 'justify', textAlignLast: 'justify', width: '100%' }}
                >2026</span>
                <span
                  className="text-white text-[12px] md:text-[15px] block"
                  style={{ fontWeight: 700, textAlign: 'justify', textAlignLast: 'justify', width: '100%' }}
                >지방선거</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 flex flex-col">
        <Outlet context={{ setCustomBackHandler }} />
      </main>

      {/* Footer */}
      <footer ref={footerRef} style={{ backgroundColor: '#1a2a4a', color: '#fff' }}>
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="container mx-auto px-4 py-2.5">
            <p
              style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.4)',
                textAlign: 'center',
              }}
            >
              {/* PC: 한 줄에 | 구분, 모바일: 세 줄 */}
              <span className="hidden md:inline">
                지도 데이터: southkorea-maps (GitHub)&nbsp;&nbsp;|&nbsp;&nbsp;모든 영상은 유튜브에서 제공됩니다.&nbsp;&nbsp;|&nbsp;&nbsp;후보자 정보는 중앙선거관리위원회·더불어민주당 특별 홈페이지에서도 확인 가능합니다.
              </span>
              <span className="md:hidden">
                지도 데이터: southkorea-maps (GitHub)<br />
                모든 영상은 유튜브에서 제공됩니다.<br />
                후보자 정보는 중앙선거관리위원회·더불어민주당 특별 홈페이지에서도 확인 가능합니다.
              </span>
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          {/* PC/태블릿: 기존 가로 레이아웃 */}
          <div className="hidden md:flex items-center gap-6" style={{ flexWrap: 'wrap' }}>
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              <img
                src={footerLogo}
                alt="더불어민주당 경기도당"
                style={{ height: '50px', width: 'auto', display: 'block', objectFit: 'contain' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <p
                className="lg:whitespace-nowrap"
                style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.8', margin: 0 }}
              >
                경기도 수원시 팔달구 효원로 119 (매교동 164-1) 청운빌딩 3층
                &nbsp;&nbsp;|&nbsp;&nbsp;전화 : 031-244-6501
                &nbsp;&nbsp;|&nbsp;&nbsp;팩스 : 031-244-6502
              </p>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '4px', marginBottom: 0 }}>
                &copy; 2018–2026 더불어민주당경기도당. All rights reserved.
              </p>
            </div>
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              <FooterDropdown />
            </div>
          </div>

          {/* 모바일: 로고 좌측 + 주소/연락처 우측 한 줄 압축 */}
          <div className="flex md:hidden items-center gap-3">
            <img
              src={footerLogo}
              alt="더불어민주당 경기도당"
              style={{ height: '32px', width: 'auto', flexShrink: 0, objectFit: 'contain' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6', margin: 0 }}>
                경기도 수원시 팔달구 효원로 119 (매교동 164-1) 청운빌딩 3층<br />
                전화 : 031-244-6501 / 팩스 : 031-244-6502
              </p>
              <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginTop: '3px', marginBottom: 0 }}>
                &copy; 2018–2026 더불어민주당경기도당. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Buttons - 모든 페이지에서 보임 */}
      <FloatingButtons footerRef={footerRef} onBack={customBackHandler || undefined} />
    </div>
  );
}