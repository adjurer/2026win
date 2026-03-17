// ============================================================
// CSV 공약 원문 파서
// 중앙선관위 CSV에서 key_pledge, full_pledge를 원문 그대로 추출
// ============================================================

// Vite assetsInclude에 CSV가 등록되어 있으므로, import 시 URL 문자열 반환
import csvUrl from '../../imports/선관위_예비후보자_명부(실시간)_-_피그마전달_V2_20260317_225720-2.csv';

export interface PledgeData {
  keyPledge: string;   // 주요 공약 원문
  fullPledge: string;  // 전체 공약 원문
}

/**
 * 컬럼 수 인식 CSV 파서 — 비표준 따옴표 + 멀티라인 필드 완전 지원
 *
 * 이 CSV의 full_pledge 셀에는 다음 비표준 패턴이 공존합니다:
 *   1) ""text"" — 리터럴 따옴표가 doubled-quote로 인코딩
 *   2) 셀 안의 리터럴 "가 줄바꿈(\n) 직전에 위치 → 표준 파서가 필드 종료로 오판
 *   3) 셀 안에 ", (따옴표+콤마) 패턴 존재 → 표준 파서가 필드 종료로 오판
 *      예: "민주당 먼저", "성과 먼저" (텍스트 안의 한국어 인용 부호)
 *
 * 해결: 헤더의 컬럼 수(expectedCols)를 먼저 파악한 뒤,
 * ", 패턴에 대해 멀티라인 필드 내부에서는 나머지 행 구조를 검증하여
 * 실제 필드 종료인지 리터럴인지 판별합니다.
 */
function parseCSV(text: string): string[][] {
  // 1단계: 첫 줄(헤더)만 빠르게 파싱하여 기대 컬럼 수 산출
  const firstLineEnd = text.indexOf('\n');
  const headerLine = firstLineEnd >= 0 ? text.substring(0, firstLineEnd).replace(/\r$/, '') : text;
  const expectedCols = headerLine.split(',').length;

  // 헬퍼: 특정 위치부터 다음 줄바꿈까지 top-level(따옴표 밖) 콤마 수 세기
  function countRemainingCommasToEOL(from: number): number {
    let count = 0;
    let inQ = false;
    for (let j = from; j < text.length; j++) {
      const c = text[j];
      if (c === '\r' || c === '\n') break;
      if (c === '"') inQ = !inQ;
      if (c === ',' && !inQ) count++;
    }
    return count;
  }

  // 2단계: 전체 파싱
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let fieldHasNewline = false;  // 현재 따옴표 필드에 줄바꿈이 포함되었는지
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '\n' || ch === '\r') {
        // 따옴표 필드 안의 줄바꿈 → fieldHasNewline 마킹
        fieldHasNewline = true;
        field += ch;
        i++;
      } else if (ch === '"') {
        const next = i + 1 < text.length ? text[i + 1] : '';
        if (next === '"') {
          // 표준 이스케이프: "" → 리터럴 "
          field += '"';
          i += 2;
        } else if (next === ',') {
          // ", 패턴: 멀티라인 필드에서는 나머지 행 구조 검증
          if (fieldHasNewline) {
            // 이 "," 이 진짜 필드 종료인지 확인:
            // 종료한다면 row.length+1 필드 완료, 이후 EOL까지 콤마 수 = 나머지 필드 수-1
            const remainingCommas = countRemainingCommasToEOL(i + 2);
            const totalIfClose = row.length + 1 + 1 + remainingCommas; // 현재필드 + 나머지(콤마+1)
            if (totalIfClose === expectedCols) {
              // 컬럼 수 일치 → 실제 필드 종료
              inQuotes = false;
              fieldHasNewline = false;
              i++;
            } else {
              // 컬럼 수 불일치 → 리터럴 "
              field += '"';
              i++;
            }
          } else {
            // 단일행 따옴표 필드 → 표준: 항상 필드 종료
            inQuotes = false;
            fieldHasNewline = false;
            i++;
          }
        } else if (next === '\r' || next === '\n' || next === '') {
          // 행 끝 또는 EOF → 현재 행의 컬럼 수 검증
          const colsIfClose = row.length + 1;
          if (colsIfClose >= expectedCols) {
            // 기대 컬럼 수 충족 → 실제 필드 종료
            inQuotes = false;
            fieldHasNewline = false;
            i++;
          } else {
            // 컬럼 수 부족 → 이 "는 셀 내부 리터럴 따옴표
            field += '"';
            i++;
          }
        } else {
          // 비표준: " 뒤에 일반 문자 → 리터럴 " 로 취급
          field += '"';
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        fieldHasNewline = false;
        i++;
      } else if (ch === ',') {
        row.push(field);
        field = '';
        i++;
      } else if (ch === '\r') {
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
        i++;
        if (i < text.length && text[i] === '\n') i++;
      } else if (ch === '\n') {
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function buildMap(csvText: string): Record<string, PledgeData> {
  const rows = parseCSV(csvText);
  if (rows.length === 0) return {};

  const header = rows[0];
  const idx = {
    nameHanja: header.indexOf('candidate_name_hanja'),
    district: header.indexOf('district_name'),
    keyPledge: header.indexOf('key_pledge'),
    fullPledge: header.indexOf('full_pledge'),
    matchingKey: header.indexOf('matching_key'),
  };

  console.log(`[CSV Parser] 총 ${rows.length - 1}행 파싱됨 | 컬럼 인덱스: key_pledge=${idx.keyPledge}, full_pledge=${idx.fullPledge}, matching_key=${idx.matchingKey}`);

  const map: Record<string, PledgeData> = {};
  let matched = 0;
  let skippedCols = 0;
  let skippedEmpty = 0;

  for (let r = 1; r < rows.length; r++) {
    const cols = rows[r];
    if (!cols || cols.length < 10) { skippedCols++; continue; }

    let key = '';
    if (idx.matchingKey >= 0 && cols[idx.matchingKey]) {
      key = cols[idx.matchingKey].trim();
    }
    if (!key && idx.district >= 0 && idx.nameHanja >= 0) {
      const district = cols[idx.district]?.trim() || '';
      const rawName = cols[idx.nameHanja]?.trim() || '';
      const name = rawName.replace(/\s*\(.*?\)\s*$/, '').trim();
      key = `${district}|${name}`;
    }
    if (!key) continue;

    const keyPledge = (idx.keyPledge >= 0 ? cols[idx.keyPledge] : '') || '';
    const fullPledge = (idx.fullPledge >= 0 ? cols[idx.fullPledge] : '') || '';

    if (keyPledge.trim() || fullPledge.trim()) {
      map[key] = {
        keyPledge: keyPledge.trim(),
        fullPledge: fullPledge.trim(),
      };
      matched++;
    } else {
      skippedEmpty++;
    }
  }

  console.log(`[CSV Parser] 공약 매핑 완료: ${matched}명 매핑 | ${skippedCols}행 컬럼부족 스킵 | ${skippedEmpty}행 공약없음 스킵`);
  if (matched > 0) {
    const sampleKeys = Object.keys(map).slice(0, 3);
    console.log(`[CSV Parser] 매핑 키 샘플:`, sampleKeys);
    const firstKey = sampleKeys[0];
    console.log(`[CSV Parser] 첫 번째 공약 미리보기 (${firstKey}):`, {
      keyPledge: map[firstKey].keyPledge.substring(0, 80) + '...',
      fullPledge: map[firstKey].fullPledge.substring(0, 80) + '...',
    });
  }

  return map;
}

// ── 캐시: 한 번만 fetch & parse ──
let _cache: Record<string, PledgeData> | null = null;
let _promise: Promise<Record<string, PledgeData>> | null = null;

/**
 * CSV를 fetch()로 로드하고 파싱 (비동기, 캐시)
 */
export async function loadPledgeMap(): Promise<Record<string, PledgeData>> {
  if (_cache) return _cache;
  if (_promise) return _promise;

  _promise = (async () => {
    try {
      const res = await fetch(csvUrl);
      const text = await res.text();
      _cache = buildMap(text);
    } catch (err) {
      console.error('[CSV Parser] 공약 데이터 로드 실패:', err);
      _cache = {};
    }
    return _cache;
  })();

  return _promise;
}

/**
 * 동기적으로 캐시된 결과 반환 (아직 로드 전이면 빈 객체)
 */
export function getPledgeMapSync(): Record<string, PledgeData> {
  return _cache || {};
}