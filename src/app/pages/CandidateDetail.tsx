import { useParams, useNavigate } from 'react-router';
import { fetchViewCounts } from '../data/youtubeApi';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ArrowLeft, Play, Eye, Briefcase, GraduationCap, Sparkles, FileText, ChevronDown } from 'lucide-react';
import { candidatesData, isPledgesLoaded, onPledgesLoaded } from '../data/candidates';
import { VideoModal } from '../components/VideoModal';

// 인라인 keyframes 주입 — 모바일 호환 보장
const videoButtonStyles = `
@keyframes vb-pulse-ring {
  0% { transform: scale(1); opacity: 0.6; }
  70% { transform: scale(1.35, 1.6); opacity: 0; }
  100% { transform: scale(1.35, 1.6); opacity: 0; }
}
@keyframes vb-glow {
  0%, 100% { box-shadow: 0 0 6px rgba(67,232,216,0.35), 0 0 14px rgba(67,232,216,0.15); }
  50% { box-shadow: 0 0 16px rgba(67,232,216,0.75), 0 0 30px rgba(67,232,216,0.35); }
}
@keyframes vb-shimmer {
  0% { transform: translateX(-100%); }
  50%, 100% { transform: translateX(100%); }
}
`;

// 공개면접 아이콘
function InterviewIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

// 합동토론회 아이콘
function DebateIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <line x1="9" y1="9" x2="15" y2="9" />
      <line x1="9" y1="13" x2="13" y2="13" />
    </svg>
  );
}

// 합동연설회 아이콘
function SpeechIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

export default function CandidateDetail() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const [videoModal, setVideoModal] = useState<{ videoId: string; title: string } | null>(null);
  const [hoveredVideoBtn, setHoveredVideoBtn] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pledgesExpanded, setPledgesExpanded] = useState(false);
  const [, setPledgesReady] = useState(isPledgesLoaded());

  // CSV 공약 비동기 로드 완료 시 재렌더링
  useEffect(() => {
    if (isPledgesLoaded()) return;
    return onPledgesLoaded(() => setPledgesReady(true));
  }, []);

  // 태블릿 vs 데스크탑 감지 (md:768~1023 = tablet, lg:1024+ = desktop)
  const [isTablet, setIsTablet] = useState(false);
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setIsTablet(w >= 768 && w < 1024);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // 비례 텍스트 스타일 (모바일 name=34px 기준 비율 유지)
  // 태블릿 name=52px (1.53x), PC name=72px (2.12x)
  const dt = useMemo(() => {
    const nameSize = isTablet ? 52 : 72;
    return {
      name: { fontSize: `${nameSize}px`, fontWeight: 800, letterSpacing: '0.25em', color: 'white', lineHeight: 1.1, marginBottom: `${Math.round(nameSize * 0.06)}px` },
      hanja: { fontSize: `${Math.round(nameSize * 0.5)}px`, fontWeight: 400, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', lineHeight: 1.2, marginBottom: `${Math.round(nameSize * 0.21)}px` },
      info: { fontSize: `${Math.round(nameSize * 0.31)}px`, fontWeight: 400, color: 'rgba(255,255,255,0.5)', lineHeight: 1.2, marginBottom: `${Math.round(nameSize * 0.53)}px` },
      occupation: { fontSize: `${Math.round(nameSize * 0.31)}px`, fontWeight: 600, color: 'rgba(255,255,255,0.8)', lineHeight: 1.3, height: `${Math.round(nameSize * 0.31 * 1.3)}px`, letterSpacing: '0.04em' },
      badge: isTablet
        ? { fontSize: '20px', padding: '12px 24px' }
        : { fontSize: '22px', padding: '14px 28px' },
      photo: { width: isTablet ? '220px' : '270px', height: isTablet ? '280px' : '345px' },
    };
  }, [isTablet]);

  let candidate = null;
  let regionId = '';

  for (const [region, candidates] of Object.entries(candidatesData)) {
    const found = candidates.find(c => c.id === candidateId);
    if (found) {
      candidate = found;
      regionId = region;
      break;
    }
  }

  // 되돌리기 플로팅 버튼 → 해당 지역 후보 목록으로 이동
  const handleBack = useCallback(() => {
    if (regionId) {
      navigate(`/?region=${regionId}`);
    } else {
      navigate('/');
    }
  }, [navigate, regionId]);

  // 더미 유튜브 영상 ID (추후 실제 영상으로 교체)
  const DUMMY_VIDEO_ID = 'dQw4w9WgXcQ';

  // 영상별 videoId 파싱
  const extractVideoId = useCallback((url?: string) => {
    if (!url) return DUMMY_VIDEO_ID;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?]+)/);
    return match ? match[1] : DUMMY_VIDEO_ID;
  }, []);

  const positionTitle = candidate
    ? (candidate.regionName.endsWith('시')
      ? candidate.regionName + '장'
      : candidate.regionName.endsWith('군')
        ? candidate.regionName + '수'
        : candidate.regionName + '장')
    : '';

  const hasSns = candidate ? candidate.sns && (candidate.sns.youtube || candidate.sns.instagram || candidate.sns.facebook || candidate.sns.blog) : false;

  const handleVideoClick = useCallback((label: string, videoUrl?: string) => {
    const vid = extractVideoId(videoUrl);
    setVideoModal({ videoId: vid, title: `${label} - ${candidate?.name || ''}` });
  }, [candidate, extractVideoId]);

  const videoCards = useMemo(() => {
    if (!candidate) return [];
    return [
      {
        key: 'interview',
        label: '공개면접',
        icon: InterviewIcon,
        videoId: extractVideoId(candidate.interviewVideo),
        videoField: candidate.interviewVideo,
        color: '#003da5',
        bgGradient: 'linear-gradient(135deg, #003da5, #2fa4e7)',
      },
      {
        key: 'debate',
        label: '합동토론회',
        icon: DebateIcon,
        videoId: extractVideoId(candidate.debateVideo),
        videoField: candidate.debateVideo,
        color: '#7c3aed',
        bgGradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
      },
      {
        key: 'speech',
        label: '합동연설회',
        icon: SpeechIcon,
        videoId: extractVideoId(candidate.speechVideo),
        videoField: candidate.speechVideo,
        color: '#059669',
        bgGradient: 'linear-gradient(135deg, #059669, #34d399)',
      },
    ];
  }, [candidate, extractVideoId]);

  // 공개된 영상 버튼만 필터 (영상 URL이 있는 것만 표시)
  const visibleVideoCards = useMemo(
    () => videoCards.filter((btn) => !!btn.videoField),
    [videoCards]
  );

  // YouTube 조회수 가져오기
  const [viewCounts, setViewCounts] = useState<Record<string, string>>({});
  useEffect(() => {
    if (videoCards.length === 0) return;
    const ids = [...new Set(videoCards.map(v => v.videoId))];
    fetchViewCounts(ids).then((counts) => {
      setViewCounts(counts);
    });
  }, [videoCards]);

  if (!candidate) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-xl text-gray-400 mb-4">후보자를 찾을 수 없습니다.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-lg bg-[#003da5] text-white hover:bg-[#002a75] transition-colors cursor-pointer"
            style={{ fontWeight: 600 }}
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fb] flex-1 flex flex-col" style={{ minWidth: '360px' }}>
      {/* 인라인 keyframes 주입 — 모바일 호환 보장 */}
      <style dangerouslySetInnerHTML={{ __html: videoButtonStyles }} />
      {/* 상단 헤더 영역 */}
      <div
        className="relative"
        style={{
          background: 'linear-gradient(135deg, #003da5 0%, #2fa4e7 60%, #43e8d8 100%)',
        }}
      >
        <div className="absolute inset-0 opacity-10 overflow-hidden">
          <div className="absolute top-[-50%] right-[-20%] w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
          <div className="absolute bottom-[-30%] left-[-10%] w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
        </div>

        <div className="container mx-auto px-4 pt-4 pb-4 md:pt-8 md:pb-14 relative z-10">
          {/* 뒤로가기 + 라벨 한 줄 배치 */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <button
              onClick={() => navigate(`/?region=${regionId}`)}
              className="inline-flex items-center gap-1.5 text-white/80 hover:text-white transition-colors cursor-pointer text-[13px] md:text-[15px]"
              style={{ fontWeight: 500 }}
            >
              <ArrowLeft size={16} />
              후보자 목록
            </button>

            {/* 모바일: 예비후보 뱃지 */}
            <span
              className="md:hidden inline-block px-3.5 py-1.5 rounded-lg text-[12px] text-white shadow-md"
              style={{ fontWeight: 700, background: '#002BFF' }}
            >
              {positionTitle} 예비후보
            </span>
          </div>

          {/* ===== 모바일 레이아웃 ===== */}
          <div className="flex flex-col items-center gap-4 md:hidden">
            {/* 사진 */}
            <div className="shrink-0">
              <div
                className="w-[160px] h-[200px] rounded-2xl p-[3px]"
                style={{ background: 'rgba(255,255,255,0.3)' }}
              >
                <div className="relative w-full h-full rounded-xl overflow-hidden" style={{ backgroundColor: '#e8ecf2' }}>
                  <img src={candidate.imageUrl} alt={candidate.name} className="w-full h-full rounded-xl object-cover" style={{ objectPosition: 'center 15%' }} />
                  <div className="absolute bottom-0 left-0 right-0 h-[35%] rounded-b-xl pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0, 40, 120, 0.35) 0%, transparent 100%)' }} />
                </div>
              </div>
            </div>
            {/* 텍스트 정보 — 모든 간격을 spacer div로 하드코딩 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0px' }}>
              {/* 이름: paddingLeft로 letterSpacing 시각 보정 */}
              <div
                style={{
                  fontSize: '34px',
                  fontWeight: 800,
                  letterSpacing: '0.25em',
                  paddingLeft: '0.25em',
                  color: 'white',
                  textAlign: 'center',
                  lineHeight: 1.1,
                  marginBottom: '2px',
                }}
              >{candidate.name}</div>

              {/* 한자이름 — 이름과 매우 가깝게 (2px) */}
              {candidate.nameHanja && (
                <div
                  style={{
                    fontSize: '17px',
                    fontWeight: 400,
                    letterSpacing: '0.08em',
                    paddingLeft: '0.08em',
                    color: 'rgba(255,255,255,0.5)',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    marginBottom: '7px',
                  }}
                >{candidate.nameHanja}</div>
              )}

              {/* 기본정보 — 한자와 간격 넓게 (14px margin-bottom from hanja) */}
              {candidate.gender && (
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.5)',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    marginBottom: '18px',
                  }}
                >{candidate.gender} · {candidate.age || ''}{candidate.birthday ? ` · ${candidate.birthday}` : ''}</div>
              )}

              {/* 직업 — 기본정보와 간격 더 넓게 (18px margin-bottom from info) */}
              {candidate.occupation && candidate.occupation !== '정당인' && candidate.occupation !== '무직' && (
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.8)',
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}
                >{candidate.occupation}</div>
              )}
              {candidate.occupation === '정당인' && (
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.8)',
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}
                >정치인</div>
              )}
            </div>
            {/* 영상 버튼 (모바일) */}
            <div className="shrink-0 flex flex-col items-center gap-2.5">
              <div className="relative flex flex-wrap justify-center items-center gap-3 shrink-0">
                {visibleVideoCards.length === 0 && <span className="text-[12px] text-white/40 py-2" style={{ fontWeight: 500 }}>영상 준비 중</span>}
                {visibleVideoCards.map((btn) => (
                  <div key={btn.key} className="relative">
                    <span className="absolute inset-0 rounded-full pointer-events-none" style={{ border: '2px solid rgba(67,232,216,0.5)', animation: 'vb-pulse-ring 2.5s ease-out infinite' }} />
                    <button onClick={() => handleVideoClick(btn.label, btn.videoField)} className="relative h-9 px-3.5 rounded-full inline-flex items-center gap-1.5 transition-all cursor-pointer text-white whitespace-nowrap overflow-hidden bg-white/30 hover:bg-white/45 hover:scale-105" style={{ animation: 'vb-glow 2s ease-in-out infinite' }} title={btn.label}>
                      <span className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)', animation: 'vb-shimmer 3s ease-in-out infinite' }} />
                      <span className="relative flex items-center justify-center" style={{ width: '16px', height: '16px' }}><btn.icon size={16} /></span>
                      <span className="relative text-[11px] leading-none" style={{ fontWeight: 600 }}>{btn.label}</span>
                    </button>
                  </div>
                ))}
              </div>
              {hasSns && (
                <div className="flex items-center gap-2">
                  {candidate.sns?.youtube && <a href={candidate.sns.youtube} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors" title="YouTube"><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg></a>}
                  {candidate.sns?.instagram && <a href={candidate.sns.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors" title="Instagram"><svg width="17" height="17" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919 1.266.058 1.644.07 4.85.07 3.204 0 3.584-.012 4.849-.07 3.26-.149 4.771-1.699 4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.014-3.668.072-4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" /></svg></a>}
                  {candidate.sns?.facebook && <a href={candidate.sns.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors" title="Facebook"><svg width="17" height="17" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg></a>}
                  {candidate.sns?.blog && <a href={candidate.sns.blog} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors" title="Blog"><svg width="17" height="17" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="0"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" /></svg></a>}
                </div>
              )}
            </div>
          </div>

          {/* ===== PC/태블릿 레이아웃 (md+) ===== */}
          {/* 뱃지 상단 = 사진 상단, 직업 하단 = 공개면접 하단 = 사진 하단 정렬 */}
          <div className="hidden md:flex flex-row md:px-8 lg:px-16">
            {/* 좌측: 예비후보 뱃지(상단) + 이름~직업(하단) */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* 예비후보 뱃지 — 상단 (사진 상단과 같은 선) */}
              <div className="mb-auto">
                <span
                  className="inline-block rounded-lg text-white shadow-md"
                  style={{ fontWeight: 700, background: '#002BFF', fontSize: dt.badge.fontSize, padding: dt.badge.padding }}
                >
                  {positionTitle} 예비후보
                </span>
              </div>

              {/* 이름~직업 텍스트 그룹 — 하단 (사진 하단과 같은 선) */}
              <div className="text-left">
                <div style={dt.name as React.CSSProperties}>{candidate.name}</div>
                {candidate.nameHanja && (
                  <div style={dt.hanja as React.CSSProperties}>{candidate.nameHanja}</div>
                )}
                {candidate.gender && (
                  <div style={dt.info as React.CSSProperties}>{candidate.gender} · {candidate.age || ''}{candidate.birthday ? ` · ${candidate.birthday}` : ''}</div>
                )}
                {candidate.occupation && candidate.occupation !== '정당인' && candidate.occupation !== '무직' && (
                  <div style={dt.occupation as React.CSSProperties}>{candidate.occupation}</div>
                )}
                {candidate.occupation === '정당인' && (
                  <div style={dt.occupation as React.CSSProperties}>정치인</div>
                )}
              </div>
            </div>

            {/* 중앙: 영상 버튼 — 하단 정렬 */}
            <div className="shrink-0 flex flex-col justify-end items-center mx-8 lg:mx-12 pb-1">
              <div className="relative flex flex-col items-center gap-3 shrink-0">
                {visibleVideoCards.length === 0 && (
                  <span className="text-[12px] text-white/40 py-2" style={{ fontWeight: 500 }}>영상 준비 중</span>
                )}
                {visibleVideoCards.map((btn) => (
                  <div key={btn.key} className="relative">
                    <span className="absolute inset-0 rounded-full pointer-events-none" style={{ border: '2px solid rgba(67,232,216,0.5)', animation: 'vb-pulse-ring 2.5s ease-out infinite' }} />
                    <button
                      onClick={() => handleVideoClick(btn.label, btn.videoField)}
                      className="relative h-9 px-3.5 rounded-full inline-flex items-center gap-1.5 transition-all cursor-pointer text-white whitespace-nowrap overflow-hidden bg-white/30 hover:bg-white/45 hover:scale-105"
                      style={{ animation: 'vb-glow 2s ease-in-out infinite' }}
                      title={btn.label}
                      onMouseEnter={() => { if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current); setHoveredVideoBtn(btn.key); }}
                      onMouseLeave={() => { hoverTimeoutRef.current = setTimeout(() => setHoveredVideoBtn(null), 200); }}
                    >
                      <span className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)', animation: 'vb-shimmer 3s ease-in-out infinite' }} />
                      <span className="relative flex items-center justify-center" style={{ width: '16px', height: '16px' }}><btn.icon size={16} /></span>
                      <span className="relative text-[12px] leading-none" style={{ fontWeight: 600 }}>{btn.label}</span>
                    </button>
                    {/* 호버 시 영상 미리보기 팝업 */}
                    {hoveredVideoBtn === btn.key && (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 z-50"
                        style={{ top: 'calc(100% + 10px)', width: '280px' }}
                        onMouseEnter={() => { if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current); setHoveredVideoBtn(btn.key); }}
                        onMouseLeave={() => { setHoveredVideoBtn(null); }}
                      >
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 rounded-sm" style={{ background: '#1a1a1a' }} />
                        <div className="rounded-xl overflow-hidden shadow-2xl cursor-pointer" style={{ background: '#1a1a1a' }} onClick={() => handleVideoClick(btn.label, btn.videoField)}>
                          <div className="relative aspect-video overflow-hidden">
                            <img src={`https://img.youtube.com/vi/${btn.videoId}/mqdefault.jpg`} alt={btn.label} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                <Play size={18} className="text-[#003da5] ml-0.5" fill="#003da5" />
                              </div>
                            </div>
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] text-white" style={{ background: btn.bgGradient, fontWeight: 600 }}>{btn.label}</div>
                          </div>
                          <div className="px-3 py-2.5">
                            <p className="text-[12px] text-white mb-1 line-clamp-1" style={{ fontWeight: 600 }}>{candidate.regionName} {btn.label} — {candidate.name}</p>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                              {viewCounts[btn.videoId] && <span className="flex items-center gap-1"><Eye size={10} />조회수 {viewCounts[btn.videoId]}</span>}
                              <span>클릭하여 재생</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* SNS */}
              {hasSns && <div className="w-px h-6 bg-white/20 mx-1 mt-2" />}
              {hasSns && (
                <div className="flex items-center gap-2 mt-1">
                  {candidate.sns?.youtube && <a href={candidate.sns.youtube} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors" title="YouTube"><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg></a>}
                  {candidate.sns?.instagram && <a href={candidate.sns.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors" title="Instagram"><svg width="17" height="17" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" /></svg></a>}
                  {candidate.sns?.facebook && <a href={candidate.sns.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors" title="Facebook"><svg width="17" height="17" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg></a>}
                  {candidate.sns?.blog && <a href={candidate.sns.blog} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors" title="Blog"><svg width="17" height="17" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="0"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" /></svg></a>}
                </div>
              )}
            </div>

            {/* 우측: 후보자 사진 — 높이가 전체 행 기준 */}
            <div className="shrink-0">
              <div
                className="rounded-2xl p-[3px]"
                style={{ background: 'rgba(255,255,255,0.3)', width: dt.photo.width, height: dt.photo.height }}
              >
                <div className="relative w-full h-full rounded-xl overflow-hidden" style={{ backgroundColor: '#e8ecf2' }}>
                  <img src={candidate.imageUrl} alt={candidate.name} className="w-full h-full rounded-xl object-cover" style={{ objectPosition: 'center 15%' }} />
                  <div className="absolute bottom-0 left-0 right-0 h-[35%] rounded-b-xl pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0, 40, 120, 0.35) 0%, transparent 100%)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 대표경력 + 대표학력 카드 (2열 그리드) */}
      <div className="container mx-auto px-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 대표경력 */}
          {candidate.career && candidate.career.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Briefcase size={16} className="text-blue-500" />
                </div>
                <div className="text-[15px] text-gray-900" style={{ fontWeight: 700 }}>대표경력</div>
              </div>
              <ul className="space-y-2.5">
                {candidate.career.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600">
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-blue-300 mt-[7px]" />
                    <span style={{ wordBreak: 'keep-all' }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* 대표학력 */}
          {candidate.education && candidate.education.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <GraduationCap size={16} className="text-emerald-500" />
                </div>
                <div className="text-[15px] text-gray-900" style={{ fontWeight: 700 }}>대표학력</div>
              </div>
              <ul className="space-y-2.5">
                {candidate.education.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600">
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-300 mt-[7px]" />
                    <span style={{ wordBreak: 'keep-all' }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* 주요 공약 + 전체 공약 (CSV 원문) */}
      <div className="container mx-auto px-4 mt-4">
        {/* 주요 공약 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <div className="text-[15px] text-gray-900" style={{ fontWeight: 700 }}>
                주요 공약
              </div>
            </div>
          </div>
          {candidate.keyPledge ? (
            <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100/50">
              <div className="text-[13px] text-gray-700" style={{ lineHeight: 1.8, wordBreak: 'keep-all', whiteSpace: 'pre-line' }}>
                {candidate.keyPledge}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-5 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2.5">
                <Sparkles size={18} className="text-gray-300" />
              </div>
              <p className="text-[13px] text-gray-400" style={{ fontWeight: 500 }}>
                주요 공약이 아직 등록되지 않았습니다
              </p>
              <p className="text-[11px] text-gray-300 mt-1">후보자 등록 후 업데이트 예정</p>
            </div>
          )}
        </div>

        {/* 전체 공약 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
                <FileText size={16} className="text-white" />
              </div>
              <div className="text-[15px] text-gray-900" style={{ fontWeight: 700 }}>전체 공약</div>
            </div>
            {candidate.fullPledge && (
              <button
                onClick={() => setPledgesExpanded(!pledgesExpanded)}
                className="flex items-center gap-1 text-[12px] text-indigo-500 hover:text-indigo-700 transition-colors cursor-pointer"
                style={{ fontWeight: 600 }}
              >
                {pledgesExpanded ? '접기' : '전체 보기'}
                <ChevronDown size={14} className={`transition-transform ${pledgesExpanded ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
          {candidate.fullPledge ? (
            <div
              className={`relative ${!pledgesExpanded ? 'max-h-[200px] overflow-hidden' : ''}`}
            >
              <div className="text-[13px] text-gray-700" style={{ lineHeight: 1.8, wordBreak: 'keep-all', whiteSpace: 'pre-line' }}>
                {candidate.fullPledge}
              </div>
              {!pledgesExpanded && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-20"
                  style={{ background: 'linear-gradient(transparent, white)' }}
                />
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-5 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2.5">
                <FileText size={18} className="text-gray-300" />
              </div>
              <p className="text-[13px] text-gray-400" style={{ fontWeight: 500 }}>
                전체 공약이 아직 등록되지 않았습니다
              </p>
              <p className="text-[11px] text-gray-300 mt-1">후보자 등록 후 업데이트 예정</p>
            </div>
          )}
        </div>
      </div>

      {/* 스페이서: 남은 공간 채움 */}
      <div className="flex-1 min-h-4" />

      {/* 하단 네비게이션 — 회색 전환 영역 */}
      <div className="bg-gradient-to-b from-[#f8f9fb] to-[#eef1f5] border-t border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate(`/?region=${regionId}`)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white shadow-sm border border-gray-100 text-[13px] text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              style={{ fontWeight: 600 }}
            >
              <ArrowLeft size={16} />
              후보자 목록
            </button>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] text-white cursor-pointer transition-all hover:shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #003da5, #2fa4e7)',
                fontWeight: 600,
              }}
            >
              홈으로
            </button>
          </div>
        </div>
        {/* 플로팅 버튼 여백 */}
        <div className="h-16 md:h-20" />
      </div>

      {/* 비디오 팝업 모달 */}
      {videoModal && (
        videoModal.videoId ? (
          <VideoModal
            isOpen={true}
            videoId={videoModal.videoId}
            title={videoModal.title}
            viewCount={viewCounts[videoModal.videoId]}
            onClose={() => setVideoModal(null)}
          />
        ) : (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setVideoModal(null)}>
            <div
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-full bg-[#f0f5ff] flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#003da5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <h3 className="text-[17px] text-gray-900 mb-2" style={{ fontWeight: 700 }}>
                {videoModal.title}
              </h3>
              <p className="text-[14px] text-gray-500 mb-6">
                아직 영상이 등록되지 않았습니다.<br />
                영상이 등록되면 이곳에서 시청하실 수 있습니다.
              </p>
              <button
                onClick={() => setVideoModal(null)}
                className="px-6 py-2.5 rounded-lg text-[13px] text-white cursor-pointer transition-colors"
                style={{ background: 'linear-gradient(135deg, #003da5, #2fa4e7)', fontWeight: 600 }}
              >
                확인
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}