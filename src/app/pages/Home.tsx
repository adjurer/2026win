import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, useOutletContext } from 'react-router';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { GyeonggiMap, ALL_REGIONS } from '../components/GyeonggiMap';
import { VideoCard } from '../components/VideoCard';
import { VideoModal } from '../components/VideoModal';
import { CandidateCard } from '../components/CandidateCard';
import { RegionSelectModal } from '../components/RegionSelectModal';
import { RegionDropdown } from '../components/RegionDropdown';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { regionVideos, type Video } from '../data/videos';
import { electionHistory, type ElectionRecord } from '../data/electionHistory';
import { getCandidatesByRegion, getAllCandidates } from '../data/candidates';
import { AppleDots } from '../components/AppleDots';
import { CardSwiper } from '../components/CardSwiper';
import { TabletScrollHint } from '../components/TabletScrollHint';

// 후보자 유무와 관계없이 31개 전 지역 순회 (설계 중)
const REGIONS_WITH_CANDIDATES = ALL_REGIONS;

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const regionFromUrl = searchParams.get('region');
  const { setCustomBackHandler } = useOutletContext<{ setCustomBackHandler: (fn: (() => void) | null) => void }>();

  // 초기 방문 시 지역 선택 모달
  const [showInitialModal, setShowInitialModal] = useState(false);
  const [hasSelectedRegion, setHasSelectedRegion] = useState(false);

  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedRegionName, setSelectedRegionName] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [flippedCardId, setFlippedCardId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('공개면접');
  const [viewMode, setViewMode] = useState<'videos' | 'candidates'>('candidates');

  // === 캐러셀 배너 상태 ===
  const sliderRef = useRef<Slider | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isBannerPlaying, setIsBannerPlaying] = useState(true);
  const [slideProgress, setSlideProgress] = useState(0);
  const slideProgressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const SLIDE_COUNT = 1; // 추후 2개로 확장 예정
  const AUTOPLAY_SPEED = 7000;

  // === 자동 순회 상태 ===
  const [autoRotateIndex, setAutoRotateIndex] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [autoRegionId, setAutoRegionId] = useState<string | null>(null);
  const [autoRegionName, setAutoRegionName] = useState<string>('');
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoFadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 후보 카드 전환 애니메이션용
  const [candidateFade, setCandidateFade] = useState(true);
  // 타이머 리셋 키 (prev/next 클릭 시 타이머 재시작)
  const [timerResetKey, setTimerResetKey] = useState(0);
  // 후보자 컨테이너 호버 시 자동 순회 일시 정지
  const [isHoveringCandidates, setIsHoveringCandidates] = useState(false);
  const touchPauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 태블릿 터치 시 자동 순회 일시 정지 (터치 종료 후 2초 딜레이)
  const handleCandidateTouchStart = useCallback(() => {
    if (touchPauseTimerRef.current) {
      clearTimeout(touchPauseTimerRef.current);
      touchPauseTimerRef.current = null;
    }
    setIsHoveringCandidates(true);
  }, []);

  const handleCandidateTouchEnd = useCallback(() => {
    if (touchPauseTimerRef.current) clearTimeout(touchPauseTimerRef.current);
    touchPauseTimerRef.current = setTimeout(() => {
      setIsHoveringCandidates(false);
      touchPauseTimerRef.current = null;
    }, 2000);
  }, []);

  // 태블릿 스크롤 중 자동 순회 일시정지 연장
  const handleTabletScrollActivity = useCallback(() => {
    // 스크롤할 때마다 hover 상태를 true로 유지하고 타이머를 리셋
    setIsHoveringCandidates(true);
    if (touchPauseTimerRef.current) clearTimeout(touchPauseTimerRef.current);
    touchPauseTimerRef.current = setTimeout(() => {
      setIsHoveringCandidates(false);
      touchPauseTimerRef.current = null;
    }, 3000); // 스크롤 멈춘 후 3초 뒤 자동 순회 재개
  }, []);

  // 모바일 감지 (드롭다운 롤링 제어용)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // 모바일 전체보기 페이지네이션
  const REGIONS_PER_PAGE = 15; // 5x3 (3페이지: 15+15+1)
  const regionPages = useMemo(() => {
    const pages: typeof ALL_REGIONS[] = [];
    for (let i = 0; i < ALL_REGIONS.length; i += REGIONS_PER_PAGE) {
      pages.push(ALL_REGIONS.slice(i, i + REGIONS_PER_PAGE));
    }
    return pages;
  }, []);
  const [regionPage, setRegionPage] = useState(0);
  const regionTouchRef = useRef<{ startX: number; startY: number } | null>(null);
  // 모바일 카드 스와이퍼 인덱스 (통합 도트용)
  const [mobileCardIndex, setMobileCardIndex] = useState(0);
  // 모바일 좌우 스크롤 힌트
  const [mobileSwipeHint, setMobileSwipeHint] = useState(true);
  // 선거 안내 팝업
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [infoPopupType, setInfoPopupType] = useState<'vote' | 'station'>('vote');

  // 지역 선택 시 플로팅 "되돌리기" 버튼으로 지역 해제 (모바일/태블릿/PC 공통)
  const handleBack = useCallback(() => {
    setSelectedRegion(null);
    setSelectedRegionName('');
    setViewMode('candidates');
    setIsAutoRotating(true);
    setFlippedCardId('');
    // URL에서 region 파라미터 제거 (useEffect 재트리거 방지)
    navigate('/', { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (selectedRegion) {
      // 함수를 state에 저장할 때 () => fn 래핑 필요 (setState의 함수 인자 처리 방지)
      setCustomBackHandler(() => handleBack);
    } else {
      setCustomBackHandler(null);
    }
    return () => setCustomBackHandler(null);
  }, [selectedRegion, setCustomBackHandler, handleBack]);

  // URL 파라미터로 지역 설정
  useEffect(() => {
    if (regionFromUrl) {
      const found = ALL_REGIONS.find(r => r.id === regionFromUrl);
      if (found) {
        setSelectedRegion(found.id);
        setSelectedRegionName(found.name);
        setHasSelectedRegion(true);
        setViewMode('candidates');
        setIsAutoRotating(false);
      }
    }
  }, [regionFromUrl]);

  // 초기 방문 시 모달 표시
  useEffect(() => {
    if (!regionFromUrl && !hasSelectedRegion) {
      const timer = setTimeout(() => setShowInitialModal(true), 600);
      return () => clearTimeout(timer);
    }
  }, [regionFromUrl, hasSelectedRegion]);

  // === 캐러셀 배너 자동 재생 타이머 ===
  useEffect(() => {
    if (slideProgressRef.current) clearInterval(slideProgressRef.current);
    if (!isBannerPlaying) {
      setSlideProgress(0);
      return;
    }

    setSlideProgress(0);
    const TICK = 30; // ms per tick
    const totalTicks = AUTOPLAY_SPEED / TICK;
    let tick = 0;

    slideProgressRef.current = setInterval(() => {
      tick++;
      setSlideProgress((tick / totalTicks) * 100);
      if (tick >= totalTicks) {
        tick = 0;
        setSlideProgress(0);
        sliderRef.current?.slickNext();
      }
    }, TICK);

    return () => {
      if (slideProgressRef.current) clearInterval(slideProgressRef.current);
    };
  }, [isBannerPlaying, currentSlide]);

  // === 자동 순회 타이머 ===
  useEffect(() => {
    if (!isAutoRotating || isHoveringCandidates || selectedRegion || REGIONS_WITH_CANDIDATES.length === 0) {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
      if (autoFadeTimeoutRef.current) { clearTimeout(autoFadeTimeoutRef.current); autoFadeTimeoutRef.current = null; }
      // 일시정지 시 페이드 상태 복원 (fade-out 중 정지하면 보이지 않는 상태로 멈추는 문제 방지)
      setCandidateFade(true);
      return;
    }

    // 초기 설정 (timerResetKey 변경 시에는 현재 위치 유지)
    if (timerResetKey === 0) {
      const firstRegion = REGIONS_WITH_CANDIDATES[0];
      setAutoRegionId(firstRegion.id);
      setAutoRegionName(firstRegion.name);
      setAutoRotateIndex(0);
      setCandidateFade(true);
    }

    autoTimerRef.current = setInterval(() => {
      setCandidateFade(false); // fade out
      autoFadeTimeoutRef.current = setTimeout(() => {
        autoFadeTimeoutRef.current = null;
        setAutoRotateIndex((prev) => {
          const next = (prev + 1) % REGIONS_WITH_CANDIDATES.length;
          const region = REGIONS_WITH_CANDIDATES[next];
          setAutoRegionId(region.id);
          setAutoRegionName(region.name);
          return next;
        });
        setFlippedCardId('');
        setCandidateFade(true); // fade in
      }, 300);
    }, 4000);

    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
      if (autoFadeTimeoutRef.current) { clearTimeout(autoFadeTimeoutRef.current); autoFadeTimeoutRef.current = null; }
    };
  }, [isAutoRotating, isHoveringCandidates, selectedRegion, timerResetKey]);

  const handleRegionClick = useCallback((regionId: string, regionName: string) => {
    if (regionId) {
      setIsAutoRotating(false);
    } else {
      setIsAutoRotating(true);
    }
    setSelectedRegion(regionId || null);
    setSelectedRegionName(regionName);
    setExpandedCategories({});
    setActiveTab('공개면접');
    setViewMode('candidates');
    setFlippedCardId('');
    setMobileSwipeHint(true);
  }, []);

  const handleToggleAutoRotate = useCallback(() => {
    setIsAutoRotating(prev => !prev);
  }, []);

  const handlePrevRegion = useCallback(() => {
    if (REGIONS_WITH_CANDIDATES.length === 0) return;
    setCandidateFade(false);
    setTimeout(() => {
      setAutoRotateIndex((prev) => {
        const next = (prev - 1 + REGIONS_WITH_CANDIDATES.length) % REGIONS_WITH_CANDIDATES.length;
        const region = REGIONS_WITH_CANDIDATES[next];
        setAutoRegionId(region.id);
        setAutoRegionName(region.name);
        return next;
      });
      setCandidateFade(true);
      setTimerResetKey(prev => prev + 1); // 타이머 재시작
    }, 350);
  }, []);

  const handleNextRegion = useCallback(() => {
    if (REGIONS_WITH_CANDIDATES.length === 0) return;
    setCandidateFade(false);
    setTimeout(() => {
      setAutoRotateIndex((prev) => {
        const next = (prev + 1) % REGIONS_WITH_CANDIDATES.length;
        const region = REGIONS_WITH_CANDIDATES[next];
        setAutoRegionId(region.id);
        setAutoRegionName(region.name);
        return next;
      });
      setCandidateFade(true);
      setTimerResetKey(prev => prev + 1); // 타이머 재시작
    }, 350);
  }, []);

  const handleResetAutoRotate = useCallback(() => {
    setCandidateFade(false);
    setTimeout(() => {
      setAutoRotateIndex(0);
      const first = REGIONS_WITH_CANDIDATES[0];
      if (first) {
        setAutoRegionId(first.id);
        setAutoRegionName(first.name);
      }
      setCandidateFade(true);
      setTimerResetKey(prev => prev + 1);
    }, 350);
  }, []);

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regionId = e.target.value;
    if (!regionId) {
      setSelectedRegion(null);
      setSelectedRegionName('');
      setViewMode('candidates');
      setIsAutoRotating(true);
      return;
    }
    const found = ALL_REGIONS.find(r => r.id === regionId);
    if (found) {
      setSelectedRegion(found.id);
      setSelectedRegionName(found.name);
      setViewMode('candidates');
      setIsAutoRotating(false);
    }
  };

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const handleInitialRegionSelect = (regionId: string, regionName: string) => {
    setShowInitialModal(false);
    setHasSelectedRegion(true);
    setSelectedRegion(regionId);
    setSelectedRegionName(regionName);
    setViewMode('candidates');
    setIsAutoRotating(false);
    setMobileSwipeHint(true);
  };

  const handleInitialSkip = () => {
    setShowInitialModal(false);
    setHasSelectedRegion(true);
  };

  const currentRegionData = selectedRegion ? regionVideos[selectedRegion] : null;
  const currentElection = selectedRegion ? electionHistory[selectedRegion] : null;
  const record8 = currentElection?.find(r => r.generation === 8);
  const record7 = currentElection?.find(r => r.generation === 7);

  // 오른쪽에 표시할 후보자: 수동 선택 > 자동 순회
  const displayRegionId = selectedRegion || autoRegionId;
  const displayRegionName = selectedRegion ? selectedRegionName : autoRegionName;
  const displayCandidates = useMemo(
    () => (displayRegionId ? getCandidatesByRegion(displayRegionId) : []),
    [displayRegionId]
  );

  // 자동 순회 or 수동 선택 시 역대 전적 데이터
  const displayElection = useMemo(() => {
    const rid = selectedRegion || autoRegionId;
    return rid ? (electionHistory[rid] || null) : null;
  }, [selectedRegion, autoRegionId]);

  const getVideosByCategory = (category: '공개면접' | '합동토론회' | '합동연설회') => {
    if (!currentRegionData) return [];
    return currentRegionData.videos.filter((video) => video.category === category);
  };

  const renderVideoGrid = (category: '공개면접' | '합동토론회' | '합동연설회') => {
    const videos = getVideosByCategory(category);
    const isExpanded = expandedCategories[category] || false;
    const displayed = isExpanded ? videos : videos.slice(0, 4);
    const placeholderCount = isExpanded ? 0 : Math.max(0, 4 - displayed.length);

    return (
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayed.map((video) => (
            <VideoCard
              key={video.id}
              videoId={video.videoId}
              title={video.title}
              candidate={video.candidate}
              onClick={() => handleVideoClick(video)}
            />
          ))}
          {placeholderCount > 0 && Array.from({ length: placeholderCount }).map((_, i) => (
            <div key={`ph-${i}`} className="hidden md:block invisible overflow-hidden rounded-lg shadow-md bg-white" aria-hidden="true">
              <div className="relative aspect-video overflow-hidden" />
              <div className="p-4"><h3 className="mb-1 line-clamp-2" style={{ fontWeight: 600 }}>&nbsp;</h3><p className="text-sm">&nbsp;</p></div>
            </div>
          ))}
        </div>
        {displayed.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500">이 지역의 {category} 영상이 없습니다.</p>
          </div>
        )}
      </div>
    );
  };

  const renderMoreButton = () => {
    const category = activeTab as '공개면접' | '합동토론회' | '합동연설회';
    const videos = getVideosByCategory(category);
    const isExpanded = expandedCategories[category] || false;
    if (videos.length > 4 && !isExpanded) {
      return (
        <button className="px-16 py-2.5 rounded-lg border-2 border-[#003da5]/20 text-[#003da5] hover:bg-[#003da5]/5 transition-colors cursor-pointer text-sm" style={{ fontWeight: 600 }} onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: true }))}>더보기</button>
      );
    }
    if (videos.length > 4 && isExpanded) {
      return (
        <button className="px-16 py-2.5 rounded-lg border-2 border-[#003da5]/20 text-[#003da5] hover:bg-[#003da5]/5 transition-colors cursor-pointer text-sm" style={{ fontWeight: 600 }} onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: false }))}>접기</button>
      );
    }
    return null;
  };

  // 캐러셀 배너 설정 (자체 타이머로 제어하므로 autoplay 비활성화)
  const bannerSettings = {
    dots: false,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: false,
    arrows: false,
    beforeChange: (_: number, next: number) => {
      setCurrentSlide(next);
      setSlideProgress(0);
    },
  };

  // 배너 재생/일시정지 토글
  const handleToggleBannerPlay = useCallback(() => {
    setIsBannerPlaying(prev => !prev);
  }, []);

  // 배너 도트 클릭
  const handleBannerDotClick = useCallback((index: number) => {
    sliderRef.current?.slickGoTo(index);
    setCurrentSlide(index);
    setSlideProgress(0);
  }, []);

  // 자동 순회 진행바 퍼센트
  const autoProgressPercent = REGIONS_WITH_CANDIDATES.length > 0
    ? ((autoRotateIndex + 1) / REGIONS_WITH_CANDIDATES.length) * 100
    : 0;

  // 배너 네비게이션 (각 슬라이드 내부에 배치하여 CTA와 같은 부모 기준으로 정렬)
  // SLIDE_COUNT가 2 이상일 때만 표시 (1개일 때는 숨김)
  const bannerNav = SLIDE_COUNT >= 2 ? (
    <div className="absolute z-20 flex items-end gap-2.5 right-6 md:right-auto md:left-1/2 md:-translate-x-1/2" style={{ bottom: '40px' }}>
      {/* 도트 컨테이너 (pill 형태) */}
      <div
        className="flex items-center justify-center gap-2 rounded-full backdrop-blur-md"
        style={{
          height: '40px',
          paddingLeft: '16px',
          paddingRight: '16px',
          background: 'rgba(255, 255, 255, 0.18)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        {Array.from({ length: SLIDE_COUNT }).map((_, idx) => {
          const isActive = currentSlide === idx;
          return (
            <button
              key={idx}
              onClick={() => handleBannerDotClick(idx)}
              className="relative cursor-pointer transition-all duration-300 ease-in-out rounded-full overflow-hidden"
              style={{
                width: isActive ? '28px' : '8px',
                height: '8px',
                background: isActive ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.35)',
              }}
              title={`슬라이드 ${idx + 1}`}
            >
              {isActive && (
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    width: `${isBannerPlaying ? slideProgress : 100}%`,
                    transition: isBannerPlaying ? 'none' : 'width 0.3s ease',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 재생/일시정지 버튼 (원형) */}
      <button
        onClick={handleToggleBannerPlay}
        className="flex items-center justify-center rounded-full cursor-pointer transition-all duration-200 hover:scale-105"
        style={{
          width: '40px',
          height: '40px',
          background: 'rgba(255, 255, 255, 0.18)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          border: isBannerPlaying ? '1px solid rgba(255, 255, 255, 0.12)' : '2px solid rgba(67, 232, 216, 0.7)',
        }}
        title={isBannerPlaying ? '일시정지' : '재생'}
      >
        {isBannerPlaying ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)" stroke="none">
            <rect x="6" y="4" width="4" height="16" rx="1.5" />
            <rect x="14" y="4" width="4" height="16" rx="1.5" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)" stroke="none">
            <polygon points="7,4 21,12 7,20" />
          </svg>
        )}
      </button>
    </div>
  ) : null;

  return (
    <>
      {/* ===== 1. 캐러셀 배너 ===== */}
      <section className="relative overflow-hidden banner-slider">
        <style>{`
          .banner-slider .slick-track { display: flex !important; align-items: stretch !important; }
          .banner-slider .slick-slide { height: auto !important; }
          .banner-slider .slick-slide > div { height: 100%; }
          .banner-slider .slick-slide > div > div { height: 100%; }
          .banner-slide-inner { height: 100%; display: flex; flex-direction: column; }
          .banner-title { font-size: 20px !important; line-height: 1.4 !important; }
          @media (min-width: 768px) {
            .banner-title { font-size: 32px !important; line-height: 1.15 !important; }
          }
        `}</style>
        <Slider {...bannerSettings} ref={sliderRef} afterChange={(index) => setCurrentSlide(index)}>
          <div>
            <div className="banner-slide-inner relative w-full overflow-hidden" style={{ background: 'linear-gradient(135deg, #003da5 0%, #1a5fc7 40%, #2fa4e7 100%)', minHeight: '220px' }}>
              <div className="container mx-auto px-4 relative z-10 flex-1 flex flex-col justify-center" style={{ paddingTop: '20px', paddingBottom: '28px' }}>
                <div className="max-w-xl flex flex-col gap-2.5 md:gap-3">
                  <div className="flex items-center gap-2 flex-wrap" style={{ minHeight: '28px' }}>
                    <span
                      className="inline-flex items-center gap-1.5 px-4 h-[28px] rounded-full text-[12px] text-white/90"
                      style={{ background: 'linear-gradient(135deg, #43e8d8, #2fa4e7)', fontWeight: 700 }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      D-{(() => {
                        const now = new Date();
                        const kstOffset = 9 * 60;
                        const kstNow = new Date(now.getTime() + (kstOffset + now.getTimezoneOffset()) * 60000);
                        const kstToday = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate());
                        const electionDate = new Date(2026, 5, 3);
                        return Math.ceil((electionDate.getTime() - kstToday.getTime()) / (1000 * 60 * 60 * 24));
                      })()} 지방선거
                    </span>
                  </div>
                  <h2 className="banner-title text-white" style={{ fontWeight: 800 }}>
                    우리동네를 책임질<br />지방선거 후보자를 소개해 드릴게요.
                  </h2>
                  <div>
                    <button
                      onClick={() => document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' })}
                      className="self-start inline-flex items-center justify-center px-6 rounded-full text-[13px] text-white cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                      style={{ height: '40px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 700 }}
                    >
                      후보자 보기
                    </button>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
                <div className="absolute top-10 right-10 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, #43e8d8, transparent)' }} />
                <div className="absolute bottom-10 right-40 w-60 h-60 rounded-full" style={{ background: 'radial-gradient(circle, #2fa4e7, transparent)' }} />
              </div>
              {bannerNav}
            </div>
          </div>
          {/* 추후 2번째 슬라이드 추가 예정 */}
        </Slider>
      </section>

      {/* ===== 2. 지도 + 후보자 자동순회 영역 ===== */}
      <section id="map-section" className="bg-white">
        <style>{`
          .tablet-scroll::-webkit-scrollbar { width: 4px; }
          .tablet-scroll::-webkit-scrollbar-track { background: transparent; }
          .tablet-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
          .tablet-scroll::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
        `}</style>
        <div className="container mx-auto px-4 pt-4 pb-0 md:pb-4">
          {/* 드롭다운 바 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-2.5 md:px-4 md:py-3 mb-3 relative z-40">
            <div className="flex items-center justify-center md:justify-start gap-2 sm:gap-4">
              <RegionDropdown
                regions={ALL_REGIONS}
                value={selectedRegion}
                autoDisplayName={!isMobile && !selectedRegion && autoRegionId ? displayRegionName : undefined}
                onChange={(regionId) => {
                  if (!regionId) {
                    setSelectedRegion(null);
                    setSelectedRegionName('');
                    setViewMode('candidates');
                    setIsAutoRotating(true);
                    return;
                  }
                  const found = ALL_REGIONS.find(r => r.id === regionId);
                  if (found) {
                    setSelectedRegion(found.id);
                    setSelectedRegionName(found.name);
                    setViewMode('candidates');
                    setIsAutoRotating(false);
                  }
                }}
              />
              {/* 역대 전적 배지: 수동 선택 또는 자동 순회 중 표시 */}
              {(() => {
                const dr8 = displayElection?.find(r => r.generation === 8);
                const dr7 = displayElection?.find(r => r.generation === 7);
                if (!displayRegionId || !dr8) return null;
                const badgeStyle = (rec: typeof dr8) => ({
                  backgroundColor: `${rec!.color}10`,
                  border: `1px solid ${rec!.color}30`,
                } as React.CSSProperties);
                const badgeStyleMd = (rec: typeof dr8) => ({
                  backgroundColor: `${rec!.color}10`,
                  border: `1px solid ${rec!.color}30`,
                  width: '240px',
                } as React.CSSProperties);
                return (
                  <div className={`${selectedRegion ? 'flex' : 'hidden md:flex'} items-center gap-2 flex-1 md:flex-none md:shrink-0 overflow-hidden`}>
                    {/* 모바일용 8대만 (2줄: 정당명 + 득표율/표차) — 지역 수동 선택 시에만 표시 */}
                    {selectedRegion && (
                      <div
                        className="inline-flex md:hidden flex-col items-center justify-center rounded-lg py-1 px-2.5 flex-1"
                        style={badgeStyle(dr8)}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-[10px]" style={{ color: '#6b7280', fontWeight: 500 }}>8대</span>
                          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dr8.color }} />
                          <span className="text-[11px]" style={{ color: dr8.color, fontWeight: 700 }}>{dr8.party}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px]" style={{ color: '#6b7280', fontWeight: 500 }}>{dr8.voteShare}%</span>
                          <span className="text-[9px]" style={{ color: '#9ca3af', fontWeight: 400 }}>{dr8.voteMargin}%p차</span>
                        </div>
                      </div>
                    )}
                    {/* PC/아이패드용 8대 (정당명 + 득표율) */}
                    <div
                      className="hidden md:inline-flex items-center gap-1.5 rounded-full whitespace-nowrap px-3"
                      style={{ ...badgeStyleMd(dr8), height: '28px' }}
                    >
                      <span className="text-[11px] leading-none" style={{ color: '#6b7280', fontWeight: 500 }}>8대</span>
                      <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dr8.color }} />
                      <span className="text-[11px] leading-none" style={{ color: dr8.color, fontWeight: 700, minWidth: '70px' }}>{dr8.party}</span>
                      <span className="text-[11px] leading-none tabular-nums" style={{ color: '#6b7280', fontWeight: 500, minWidth: '38px' }}>
                        {dr8.voteShare}%
                      </span>
                      <span className="text-[10px] leading-none tabular-nums" style={{ color: '#9ca3af', fontWeight: 400, minWidth: '48px' }}>
                        {dr8.voteMargin}%p차
                      </span>
                    </div>
                    {/* 7대 - md 이상에서만 표시 */}
                    {dr7 && (
                      <div
                        className="hidden md:inline-flex items-center gap-1.5 rounded-full whitespace-nowrap px-3"
                        style={{ ...badgeStyleMd(dr7), height: '28px' }}
                      >
                        <span className="text-[11px] leading-none" style={{ color: '#6b7280', fontWeight: 500 }}>7대</span>
                        <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dr7.color }} />
                        <span className="text-[11px] leading-none" style={{ color: dr7.color, fontWeight: 700, minWidth: '70px' }}>{dr7.party}</span>
                        <span className="text-[11px] leading-none tabular-nums" style={{ color: '#6b7280', fontWeight: 500, minWidth: '38px' }}>
                          {dr7.voteShare}%
                        </span>
                        <span className="text-[10px] leading-none tabular-nums" style={{ color: '#9ca3af', fontWeight: 400, minWidth: '48px' }}>
                          {dr7.voteMargin}%p차
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* 모바일 전용: 자동 순회 진행바 — 모바일에서는 숨김 (지역 그리드와 컨테이너 크기 통일) */}
          {/* isMobile auto-rotate progress bar hidden on mobile */}

          {/* 지도 + 후보자 */}
          <div className="flex flex-col md:flex-row gap-6" style={{ minHeight: 'auto', height: 'auto' }}>
            {/* Left: Map - 모바일에서는 숨김, md(768px)부터 표시 */}
            <aside className="hidden md:flex md:w-1/2 lg:w-2/5 flex-col pb-2" style={{ minHeight: '600px', height: '800px' }}>
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 flex flex-col flex-1 overflow-hidden relative">
                {/* 자동 순회 인디케이터 제거 - GyeonggiMap 내부로 이동 */}
                <GyeonggiMap
                  onRegionClick={handleRegionClick}
                  selectedRegion={selectedRegion}
                  electionRecords={currentElection}
                  autoHighlightRegion={!selectedRegion && autoRegionId ? autoRegionId : null}
                  autoElectionRecords={!selectedRegion && autoRegionId ? displayElection : null}
                  autoFade={candidateFade}
                  autoProgressPercent={!selectedRegion && autoRegionId ? autoProgressPercent : undefined}
                  autoProgressLabel={!selectedRegion && autoRegionId ? `${String(autoRotateIndex + 1).padStart(2, '0')}/${String(REGIONS_WITH_CANDIDATES.length).padStart(2, '0')}` : undefined}
                  isAutoRotating={isAutoRotating}
                  onToggleAutoRotate={handleToggleAutoRotate}
                  onPrevRegion={handlePrevRegion}
                  onNextRegion={handleNextRegion}
                  onResetAutoRotate={handleResetAutoRotate}
                />
              </div>
            </aside>

            {/* Right: 후보자 / 영상 */}
            <section className="w-full md:w-1/2 lg:w-3/5 flex flex-col overflow-visible md:min-h-[400px]">

              {/* ===== 모바일 전용: 통합 프레임 (���역 그리드 ↔ 카드 스와이퍼 동일 컨테이너) ===== */}
              <div className="md:hidden mb-2">
                {/* 콘텐츠 영역 — 항상 동일한 크기·위치 */}
                <div className="overflow-hidden relative" style={{ height: '320px' }}>
                  {!selectedRegion ? (
                    /* 전체보기: 지역 그리드 */
                    <div
                      className="w-full h-full"
                      style={{ touchAction: 'none' }}
                      onTouchStart={(e) => {
                        regionTouchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY };
                      }}
                      onTouchMove={(e) => {
                        if (!regionTouchRef.current) return;
                        const dx = e.touches[0].clientX - regionTouchRef.current.startX;
                        if (Math.abs(dx) > 8) {
                          e.preventDefault();
                        }
                      }}
                      onTouchEnd={(e) => {
                        if (!regionTouchRef.current) return;
                        const dx = e.changedTouches[0].clientX - regionTouchRef.current.startX;
                        const dy = e.changedTouches[0].clientY - regionTouchRef.current.startY;
                        regionTouchRef.current = null;
                        if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
                        if (dx < 0) {
                          setRegionPage(p => (p + 1) % regionPages.length);
                        } else if (dx > 0) {
                          setRegionPage(p => (p - 1 + regionPages.length) % regionPages.length);
                        }
                      }}
                    >
                      <div
                        className="flex transition-transform duration-300 ease-out"
                        style={{ transform: `translateX(-${regionPage * 100}%)`, willChange: 'transform' }}
                      >
                        {regionPages.map((pageRegions, pageIdx) => (
                          <div key={pageIdx} className="w-full shrink-0 px-0.5">
                            <div className="grid grid-cols-3 gap-2">
                              {pageRegions.map((region) => {
                                const candidates = getCandidatesByRegion(region.id);
                                const count = candidates.length;
                                return (
                                  <button
                                    key={region.id}
                                    onClick={() => {
                                      setSelectedRegion(region.id);
                                      setSelectedRegionName(region.name);
                                      setViewMode('candidates');
                                      setIsAutoRotating(false);
                                      setMobileSwipeHint(true);
                                    }}
                                    className="flex flex-col items-center justify-center py-2 px-2 rounded-xl border border-gray-100 bg-white hover:border-[#003da5]/30 hover:bg-[#f0f5ff] transition-all cursor-pointer"
                                    style={{ minHeight: '50px' }}
                                  >
                                    <span className="text-[13px] text-gray-800" style={{ fontWeight: 600 }}>{region.name}</span>
                                    {count > 0 ? (
                                      <span className="text-[11px] text-[#003da5] mt-0.5" style={{ fontWeight: 500 }}>{count}명</span>
                                    ) : (
                                      <span className="text-[10px] text-gray-300 mt-0.5" style={{ fontWeight: 400 }}>준비중</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : getCandidatesByRegion(selectedRegion).length > 0 ? (
                    /* 지역 선택: 카드 스와이퍼 */
                    <div className="w-full h-full flex flex-col relative">
                      {/* 진행바 — 카드 영역 내부 상단, 카드 폭(60%) 중앙 정렬 */}
                      {getCandidatesByRegion(selectedRegion).length > 1 && (
                        <div className="flex flex-col items-center pt-1 pb-0.5 shrink-0">
                          <div className="h-[3px] bg-gray-100 rounded-full overflow-hidden" style={{ width: '30%' }}>
                            <div
                              className="h-full rounded-full transition-all duration-300 ease-out"
                              style={{
                                width: `${((mobileCardIndex + 1) / getCandidatesByRegion(selectedRegion).length) * 100}%`,
                                background: 'linear-gradient(90deg, #003da5, #43e8d8)',
                              }}
                            />
                          </div>
                          <span className="text-[11px] text-gray-400 tabular-nums mt-0.5" style={{ fontWeight: 500 }}>
                            ({String(mobileCardIndex + 1).padStart(2, '0')}/{String(getCandidatesByRegion(selectedRegion).length).padStart(2, '0')})
                          </span>
                        </div>
                      )}
                      <div className="flex-1 flex items-center justify-center">
                        <CardSwiper
                          cardWidth={220}
                          cardHeight={260}
                          sideScale={0.78}
                          sideOffset={40}
                          sideVerticalOffset={16}
                          hideDots
                          infinite
                          onIndexChange={(idx) => {
                            setMobileCardIndex(idx);
                            setFlippedCardId('');
                          }}
                          onUserSwipe={() => setMobileSwipeHint(false)}
                        >
                          {getCandidatesByRegion(selectedRegion).map((candidate) => (
                            <CandidateCard
                              key={candidate.id}
                              candidate={candidate}
                              onClick={() => { if (!mobileSwipeHint) navigate(`/candidate/${candidate.id}`); }}
                              cardSize="lg"
                              flippedCardId={flippedCardId}
                              onFlipCard={(id) => { if (!mobileSwipeHint) setFlippedCardId(id); }}
                            />
                          ))}
                        </CardSwiper>
                      </div>
                      {/* 좌우 그라데이션 + 스크롤 힌트 */}
                      {getCandidatesByRegion(selectedRegion).length > 1 && (
                        <div
                          className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-600"
                          style={{
                            opacity: mobileSwipeHint ? 1 : 0,
                            pointerEvents: 'none',
                            background: 'rgba(255, 255, 255, 0.82)',
                            backdropFilter: 'blur(2px)',
                            WebkitBackdropFilter: 'blur(2px)',
                            zIndex: 30,
                          }}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-3 animate-pulse">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#003da5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 18l-6-6 6-6" />
                              </svg>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#003da5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 18l6-6-6-6" />
                              </svg>
                            </div>
                            <span
                              className="text-[14px] text-gray-600 bg-white/60 px-4 py-1.5 rounded-full"
                              style={{ fontWeight: 700 }}
                            >
                              좌우로 스크롤하세요
                            </span>
                            <span className="text-[12px] text-gray-400 mt-0.5" style={{ fontWeight: 400 }}>
                              후보자 {getCandidatesByRegion(selectedRegion).length}명
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-gray-400">이 지역의 후보자 정보가 아직 등록되지 않았습니다.</p>
                    </div>
                  )}
                </div>
                {/* 도트 인디케이터 — 카드 영역 아래 배치 */}
                <div className="flex items-center justify-center mt-1 py-0.5">
                  {!selectedRegion ? (
                    <AppleDots
                      total={regionPages.length}
                      current={regionPage}
                      onDotClick={(idx) => setRegionPage(idx)}
                    />
                  ) : getCandidatesByRegion(selectedRegion).length > 0 ? (
                    <AppleDots
                      total={getCandidatesByRegion(selectedRegion).length}
                      current={mobileCardIndex}
                    />
                  ) : (
                    <div style={{ height: '12px' }} />
                  )}
                </div>

                {/* 모바일 하단 좌우 화살표 제거됨 */}
              </div>

              {/* 자동 순회 중일 때: 후보자 카드 (태블릿/데스크탑 전용) */}
              {!selectedRegion && autoRegionId && displayRegionId ? (
                <div
                  className="hidden md:flex flex-col md:flex-1"
                  onMouseEnter={() => setIsHoveringCandidates(true)}
                  onMouseLeave={() => setIsHoveringCandidates(false)}
                  onTouchStart={handleCandidateTouchStart}
                  onTouchEnd={handleCandidateTouchEnd}
                  onTouchCancel={handleCandidateTouchEnd}
                >
                  <div
                    className="md:flex-1 transition-opacity duration-500 ease-in-out pb-0 md:pb-2"
                    style={{
                      opacity: candidateFade ? 1 : 0,
                    }}
                  >
                    {/* 데스크탑: 그리드 레이아웃 */}
                    <div className="hidden lg:grid gap-3 h-full grid-cols-3 grid-rows-3">
                      {displayCandidates.map((candidate) => (
                        <CandidateCard
                          key={candidate.id}
                          candidate={candidate}
                          onClick={() => navigate(`/candidate/${candidate.id}`)}
                          cardSize="sm"
                          flippedCardId={flippedCardId}
                          onFlipCard={setFlippedCardId}
                        />
                      ))}
                    </div>

                    {/* 태블릿(md~lg): 세로 스크롤 카드 리스트 */}
                    {displayCandidates.length > 0 && (
                      <TabletScrollHint
                        key={displayRegionId || 'auto'}
                        itemCount={displayCandidates.length}
                        className="hidden md:block lg:hidden"
                        onScrollActivity={handleTabletScrollActivity}
                      >
                        <div className="grid grid-cols-2 gap-3 pl-1 pt-1 pb-4">
                          {displayCandidates.map((candidate) => (
                            <div key={candidate.id} style={{ height: '205px' }}>
                              <CandidateCard
                                candidate={candidate}
                                onClick={() => navigate(`/candidate/${candidate.id}`)}
                                cardSize="md"
                                flippedCardId={flippedCardId}
                                onFlipCard={setFlippedCardId}
                              />
                            </div>
                          ))}
                        </div>
                      </TabletScrollHint>
                    )}
                  </div>
                </div>
              ) : selectedRegion ? (
                viewMode === 'candidates' ? (
                  <div className="hidden md:flex flex-col flex-1 pb-2">
                    {getCandidatesByRegion(selectedRegion).length > 0 ? (
                      <>
                        {/* 데스크탑: 그리드 레이아웃 */}
                        <div className="hidden lg:grid gap-3 h-full grid-cols-3 grid-rows-3">
                          {getCandidatesByRegion(selectedRegion).map((candidate) => (
                            <CandidateCard
                              key={candidate.id}
                              candidate={candidate}
                              onClick={() => navigate(`/candidate/${candidate.id}`)}
                              cardSize="sm"
                              flippedCardId={flippedCardId}
                              onFlipCard={setFlippedCardId}
                            />
                          ))}
                        </div>

                        {/* 태블릿(md~lg): 세로 스크롤 카드 리스트 */}
                        {getCandidatesByRegion(selectedRegion).length > 0 && (
                          <TabletScrollHint
                            key={selectedRegion}
                            itemCount={getCandidatesByRegion(selectedRegion).length}
                            className="hidden md:block lg:hidden"
                          >
                            <div className="grid grid-cols-2 gap-3 pl-1 pt-1 pb-4">
                              {getCandidatesByRegion(selectedRegion).map((candidate) => (
                                <div key={candidate.id} style={{ height: '205px' }}>
                                  <CandidateCard
                                    candidate={candidate}
                                    onClick={() => navigate(`/candidate/${candidate.id}`)}
                                    cardSize="md"
                                    flippedCardId={flippedCardId}
                                    onFlipCard={setFlippedCardId}
                                  />
                                </div>
                              ))}
                            </div>
                          </TabletScrollHint>
                        )}
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-gray-400">이 지역의 후보자 정보가 아직 등록되지 않았습니다.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  currentRegionData && (
                    <div className="flex flex-col flex-1">
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col">
                        <TabsList className="grid w-full grid-cols-3 mb-8 bg-[#003da5]/10">
                          <TabsTrigger value="공개면접" className="data-[state=active]:bg-[#003da5] data-[state=active]:text-white">공개면접</TabsTrigger>
                          <TabsTrigger value="합동토론회" className="data-[state=active]:bg-[#003da5] data-[state=active]:text-white">합동토론회</TabsTrigger>
                          <TabsTrigger value="합동연설회" className="data-[state=active]:bg-[#003da5] data-[state=active]:text-white">합동연설회</TabsTrigger>
                        </TabsList>
                        <TabsContent value="공개면접" className="flex flex-col flex-1">{renderVideoGrid('공개면접')}</TabsContent>
                        <TabsContent value="합동토론회" className="flex flex-col flex-1">{renderVideoGrid('합동토론회')}</TabsContent>
                        <TabsContent value="합동연설회" className="flex flex-col flex-1">{renderVideoGrid('합동연설회')}</TabsContent>
                      </Tabs>
                      <div className="pt-6 pb-2 flex justify-center">{renderMoreButton()}</div>
                    </div>
                  )
                )
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm md:text-lg text-gray-400 text-center">
                    지도에서 지역을 선택하여 후보자를 확인하세요.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </section>

      {/* ===== 3. 선거 안내 섹션 ===== */}
      <section
        className="bg-[#f5f7fa] py-8 md:py-14 pb-[72px] md:pb-[80px] lg:pb-[84px]"
      >
        <div className="container mx-auto px-4">
          <h3 className="text-[20px] md:text-[26px] text-gray-900 leading-tight mb-4" style={{ fontWeight: 800 }}>
            2026 지방선거,<br />더불어민주당에서 안내해드릴게요.
          </h3>
          <div className="flex items-center gap-2 mb-5">
            <span className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-gray-200 bg-white text-[13px] md:text-[14px] text-gray-600 shadow-sm" style={{ fontWeight: 500 }}>
              <span style={{ fontWeight: 700, color: '#003da5' }}>[선거 운동 기간]</span>
              2026.05.21 ~ 2026.06.02
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div
              onClick={() => { setInfoPopupType('vote'); setShowInfoPopup(true); }}
              className="relative rounded-2xl overflow-hidden p-6 md:p-8 min-h-[170px] flex flex-col justify-end cursor-pointer hover:scale-[1.02] transition-transform"
              style={{ background: 'linear-gradient(135deg, #2fa4e7, #5ab8f0)' }}
            >
              <div className="relative z-10">
                <h4 className="text-white text-[22px] md:text-[25px] mb-2" style={{ fontWeight: 800 }}>투표방법</h4>
                <p className="text-white/90 text-[14px] md:text-[15px]" style={{ fontWeight: 500 }}>선거구 확정 이후 확인 가능합니다.</p>
              </div>
              <div className="absolute top-3 right-3 w-24 h-24 md:w-[115px] md:h-[115px] opacity-20">
                <svg viewBox="0 0 100 100" fill="none"><rect x="15" y="30" width="70" height="55" rx="6" stroke="white" strokeWidth="3" /><rect x="30" y="10" width="40" height="30" rx="4" stroke="white" strokeWidth="3" /><line x1="35" y1="50" x2="65" y2="50" stroke="white" strokeWidth="3" /><line x1="50" y1="35" x2="50" y2="65" stroke="white" strokeWidth="3" /></svg>
              </div>
            </div>
            <div
              onClick={() => { setInfoPopupType('station'); setShowInfoPopup(true); }}
              className="relative rounded-2xl overflow-hidden p-6 md:p-8 min-h-[170px] flex flex-col justify-end cursor-pointer hover:scale-[1.02] transition-transform"
              style={{ background: 'linear-gradient(135deg, #003da5, #1a5fc7)' }}
            >
              <div className="relative z-10">
                <h4 className="text-white text-[22px] md:text-[25px] mb-2" style={{ fontWeight: 800 }}>내 투표소 찾기</h4>
                <p className="text-white/90 text-[14px] md:text-[15px]" style={{ fontWeight: 500 }}>선거구 확정 이후 확인 가능합니다.</p>
              </div>
              <div className="absolute top-3 right-3 w-24 h-24 md:w-[115px] md:h-[115px] opacity-20">
                <svg viewBox="0 0 100 100" fill="none"><circle cx="45" cy="40" r="25" stroke="white" strokeWidth="3" /><line x1="62" y1="58" x2="82" y2="78" stroke="white" strokeWidth="4" strokeLinecap="round" /><circle cx="45" cy="40" r="8" stroke="white" strokeWidth="3" /></svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} videoId={selectedVideo.videoId} title={selectedVideo.title} />
      )}

      {/* 초기 지역 선택 모달 */}
      <RegionSelectModal isOpen={showInitialModal} onSelect={handleInitialRegionSelect} onSkip={handleInitialSkip} />

      {/* 선거 안내 팝업 (투표방법 / 내 투표소 찾기) */}
      {showInfoPopup && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          onClick={() => setShowInfoPopup(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-[90%] max-w-[420px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 상단 블루 바 */}
            <div
              className="px-6 py-5 flex items-center gap-3"
              style={{ background: infoPopupType === 'vote' ? 'linear-gradient(135deg, #2fa4e7, #5ab8f0)' : 'linear-gradient(135deg, #003da5, #1a5fc7)' }}
            >
              {infoPopupType === 'vote' ? (
                <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
                  <rect x="15" y="30" width="70" height="55" rx="6" stroke="white" strokeWidth="4" />
                  <rect x="30" y="10" width="40" height="30" rx="4" stroke="white" strokeWidth="4" />
                  <line x1="35" y1="50" x2="65" y2="50" stroke="white" strokeWidth="4" />
                  <line x1="50" y1="35" x2="50" y2="65" stroke="white" strokeWidth="4" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
                  <circle cx="45" cy="40" r="25" stroke="white" strokeWidth="4" />
                  <line x1="62" y1="58" x2="82" y2="78" stroke="white" strokeWidth="5" strokeLinecap="round" />
                  <circle cx="45" cy="40" r="8" stroke="white" strokeWidth="4" />
                </svg>
              )}
              <h3 className="text-white text-[20px]" style={{ fontWeight: 800 }}>
                {infoPopupType === 'vote' ? '투표방법' : '내 투표소 찾기'}
              </h3>
            </div>

            {/* 본문 */}
            <div className="px-6 py-8 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#f0f5ff' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#003da5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p className="text-[16px] text-gray-800" style={{ fontWeight: 700 }}>
                선거구 확정 이후 확인 가능합니다
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] text-[#003da5]" style={{ background: '#f0f5ff', fontWeight: 600 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  투표일: 2026.06.03 (수)
                </span>
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="px-6 pb-6">
              <button
                onClick={() => setShowInfoPopup(false)}
                className="w-full py-3 rounded-xl text-white text-[15px] cursor-pointer transition-all hover:opacity-90"
                style={{ background: '#002BFF', fontWeight: 700 }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}