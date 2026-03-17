// ============================================================
// YouTube Data API v3 설정
// ============================================================

export const YOUTUBE_API_KEY = 'AIzaSyDaFD4dfTxp4ox7JGI5Bx9XHjSsDgGAK10';

// API 호출 캐시 유효 시간 (밀리초) — 6시간
// 조회수는 실시간으로 변할 필요가 없으므로 긴 캐시 사용
export const VIEW_COUNT_CACHE_TTL = 6 * 60 * 60 * 1000;
