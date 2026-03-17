// ============================================================
// YouTube Data API v3 — 조회수 조회 유틸리티
// API 절약 전략:
//   1) localStorage 영구 캐시 (TTL 6시간)
//   2) 세션(탭) 당 동일 videoId 재호출 방지
//   3) 50개씩 배치 조회 (1회 = 1유닛)
//   4) 동시 요청 중복 방지 (inflight 추적)
// ============================================================
import { YOUTUBE_API_KEY, VIEW_COUNT_CACHE_TTL } from './config';

const STORAGE_KEY = 'yt_view_cache_v1';

interface CachedItem {
  c: number;   // count
  f: string;   // formatted
  t: number;   // fetchedAt (timestamp)
}

// ── 메모리 캐시 (세션 내) ──
const memCache: Record<string, CachedItem> = {};

// ── 동시 요청 중복 방지 ──
let inflightPromise: Promise<Record<string, string>> | null = null;

/**
 * localStorage에서 캐시 로드 (앱 시작 시 1회)
 */
function loadStorageCache(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed: Record<string, CachedItem> = JSON.parse(raw);
    const now = Date.now();
    for (const [id, item] of Object.entries(parsed)) {
      // TTL 내 유효한 항목만 메모리 캐시로 복원
      if (now - item.t < VIEW_COUNT_CACHE_TTL) {
        memCache[id] = item;
      }
    }
  } catch {
    // 파싱 실패 시 무시
  }
}

/**
 * 메모리 캐시 → localStorage 저장
 */
function saveStorageCache(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memCache));
  } catch {
    // 용량 초과 등 무시
  }
}

// 앱 로드 시 캐시 복원
loadStorageCache();

/**
 * 조회수를 한국어 형식으로 포맷합니다.
 */
export function formatViewCount(count: number): string {
  if (count >= 100_000_000) return `${(count / 100_000_000).toFixed(1)}억회`;
  if (count >= 10_000) return `${(count / 10_000).toFixed(1)}만회`;
  if (count >= 1_000) return `${count.toLocaleString('ko-KR')}회`;
  return `${count}회`;
}

/**
 * YouTube Data API v3를 이용해 영상 조회수를 가져옵니다.
 * - 캐시 히트 시 API 호출 없이 즉시 반환
 * - 50개씩 배치 조회 (1유닛/회)
 * - 동시 호출 시 하나의 요청만 실행
 */
export async function fetchViewCounts(
  videoIds: string[]
): Promise<Record<string, string>> {
  // 고유 ID만 필터
  const uniqueIds = [...new Set(videoIds)];
  const now = Date.now();
  const result: Record<string, string> = {};
  const idsToFetch: string[] = [];

  // 1) 캐시 히트 확인 (메모리 → localStorage 이미 로드됨)
  for (const id of uniqueIds) {
    const cached = memCache[id];
    if (cached && now - cached.t < VIEW_COUNT_CACHE_TTL) {
      result[id] = cached.f;
    } else {
      idsToFetch.push(id);
    }
  }

  // 모두 캐시 히트 → API 호출 없음
  if (idsToFetch.length === 0) return result;

  // API 키 미설정 시 빈 결과
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_API_KEY_HERE') {
    return result;
  }

  // 2) 동시 요청 방지: 이미 진행 중인 요청이 있으면 대기
  if (inflightPromise) {
    const prev = await inflightPromise;
    // 이전 요청 결과에서 필요한 것 가져오기
    for (const id of idsToFetch) {
      if (prev[id]) result[id] = prev[id];
      else if (memCache[id]) result[id] = memCache[id].f;
    }
    return result;
  }

  // 3) API 호출
  const fetchPromise = (async (): Promise<Record<string, string>> => {
    const fetchResult: Record<string, string> = {};

    // 50개씩 배치
    for (let i = 0; i < idsToFetch.length; i += 50) {
      const batch = idsToFetch.slice(i, i + 50);
      try {
        const ids = batch.join(',');
        const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids}&key=${YOUTUBE_API_KEY}`;
        const res = await fetch(url);

        if (!res.ok) {
          console.error(`[YouTube API] HTTP ${res.status}`);
          continue;
        }

        const data = await res.json();
        if (data.items) {
          for (const item of data.items) {
            const count = parseInt(item.statistics?.viewCount || '0', 10);
            const formatted = formatViewCount(count);
            memCache[item.id] = { c: count, f: formatted, t: now };
            fetchResult[item.id] = formatted;
          }
        }
      } catch (err) {
        console.error('[YouTube API] 조회수 가져오기 실패:', err);
      }
    }

    // localStorage에 저장 (다음 방문 시 재사용)
    saveStorageCache();
    return fetchResult;
  })();

  inflightPromise = fetchPromise;

  try {
    const fetched = await fetchPromise;
    Object.assign(result, fetched);
  } finally {
    inflightPromise = null;
  }

  return result;
}
