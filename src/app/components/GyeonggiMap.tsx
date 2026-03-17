import { useState, useEffect, useMemo, useCallback } from 'react';
import * as topojson from 'topojson-client';
import {
  gyeonggiRegions as fallbackRegions,
  projectCoords,
  getPolygonCenter,
} from '../data/gyeonggiMapData';
import type { ElectionRecord } from '../data/electionHistory';

// ====== 타입 정의 ======
interface RenderedRegion {
  id: string;
  name: string;
  paths: string[];
  center: { x: number; y: number };
  isClickable: boolean;
}

interface GyeonggiMapProps {
  onRegionClick: (regionId: string, regionName: string) => void;
  selectedRegion: string | null;
  electionRecords?: ElectionRecord[] | null;
  onSelectedRegionData?: (data: { paths: string[]; viewBox: string } | null) => void;
  autoHighlightRegion?: string | null;
  autoElectionRecords?: ElectionRecord[] | null;
  autoFade?: boolean;
  autoProgressPercent?: number;
  autoProgressLabel?: string;
  isAutoRotating?: boolean;
  onToggleAutoRotate?: () => void;
  onPrevRegion?: () => void;
  onNextRegion?: () => void;
  onResetAutoRotate?: () => void;
}

// ====== 올바른 데이터 URL ======
const DATA_URLS = [
  // jsDelivr CDN (CORS 지원, 가장 안정적)
  'https://cdn.jsdelivr.net/gh/southkorea/southkorea-maps@master/kostat/2013/json/skorea_municipalities_topo_simple.json',
  // jsDelivr CDN (2018 데이터, 553KB)
  'https://cdn.jsdelivr.net/gh/southkorea/southkorea-maps@master/kostat/2018/json/skorea-municipalities-2018-topo-simple.json',
  // Raw GitHub (CORS 지원)
  'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2013/json/skorea_municipalities_topo_simple.json',
];

// ====== 드롭다운용 전체 시군구 목록 (가나다순) ======
export const ALL_REGIONS: { id: string; name: string }[] = [
  { id: 'gapyeong', name: '가평군' },
  { id: 'goyang', name: '고양시' },
  { id: 'gwacheon', name: '과천시' },
  { id: 'gwangju', name: '광주시' },
  { id: 'gwangmyeong', name: '광명시' },
  { id: 'guri', name: '구리시' },
  { id: 'gunpo', name: '군포시' },
  { id: 'gimpo', name: '김포시' },
  { id: 'namyangju', name: '남양주시' },
  { id: 'dongducheon', name: '동두천시' },
  { id: 'bucheon', name: '부천시' },
  { id: 'seongnam', name: '성남시' },
  { id: 'suwon', name: '수원시' },
  { id: 'siheung', name: '시흥시' },
  { id: 'ansan', name: '안산시' },
  { id: 'anseong', name: '안성시' },
  { id: 'anyang', name: '안양시' },
  { id: 'yangju', name: '양주시' },
  { id: 'yangpyeong', name: '양평군' },
  { id: 'yeoju', name: '여주시' },
  { id: 'yeoncheon', name: '연천군' },
  { id: 'osan', name: '오산시' },
  { id: 'yongin', name: '용인시' },
  { id: 'uiwang', name: '의왕시' },
  { id: 'uijeongbu', name: '의정부시' },
  { id: 'icheon', name: '이천시' },
  { id: 'paju', name: '파주시' },
  { id: 'pyeongtaek', name: '평택시' },
  { id: 'pocheon', name: '포천시' },
  { id: 'hanam', name: '하남시' },
  { id: 'hwaseong', name: '화성시' },
];

// ====== 미리보기 지도 텍스트 위치 보정 ======
const PREVIEW_TEXT_OFFSETS: Record<string, { dx: number; dy: number }> = {
  dongducheon: { dx: -3, dy: 0 },    // 왼쪽
  ansan: { dx: 0, dy: -1 },          // 아래쪽
  guri: { dx: 1, dy: 0 },            // 오른쪽
  osan: { dx: 0, dy: 0 },            // 오른쪽
  icheon: { dx: -8, dy: 0 },         // 왼쪽 많이
  gimpo: { dx: -5, dy: 0 },          // 왼쪽 많이
  hwaseong: { dx: 3, dy: 0 },        // 오른쪽
  yeoju: { dx: 3, dy: 0 },          // 오른쪽 많이
  gapyeong: { dx: -6, dy: 0 },       // 왼쪽
};

// ====== 속성 추출 (다양한 데이터 형식 지원) ======
function getFeatureCode(props: any): string {
  return props?.SIG_CD || props?.code || props?.sig_cd || props?.CODE || '';
}

function getFeatureName(props: any): string {
  return props?.SIG_KOR_NM || props?.name || props?.NAME_2 || props?.NAME || '';
}

// ====== 시도 코드 판별 ======
// 표준 행정코드: 서울=11, 인천=28, 경기=41
// KOSTAT 순차코드: 서울=11, 인천=23, 경기=31
function detectProvinceSystem(allCodes: string[]): 'standard' | 'kostat' {
  return allCodes.some(c => c.startsWith('41')) ? 'standard' : 'kostat';
}

function getProvinceType(
  code: string,
  system: 'standard' | 'kostat'
): 'gyeonggi' | 'seoul' | 'incheon' | null {
  const prefix = code.substring(0, 2);
  if (system === 'standard') {
    if (prefix === '41') return 'gyeonggi';
    if (prefix === '11') return 'seoul';
    if (prefix === '28') return 'incheon';
  } else {
    if (prefix === '31') return 'gyeonggi';
    if (prefix === '11') return 'seoul';
    if (prefix === '23') return 'incheon';
  }
  return null;
}

// ====== 이름 기반 도시 매핑 ======
// 구가 있는 시의 구 → 시 매핑
const DISTRICT_TO_CITY: Record<string, { id: string; name: string }> = {
  '장안구': { id: 'suwon', name: '수원시' },
  '권선구': { id: 'suwon', name: '수원시' },
  '팔달구': { id: 'suwon', name: '수원시' },
  '영통구': { id: 'suwon', name: '수원시' },
  '수정구': { id: 'seongnam', name: '성남시' },
  '중원구': { id: 'seongnam', name: '성남시' },
  '분당구': { id: 'seongnam', name: '성남시' },
  '만안구': { id: 'anyang', name: '안양시' },
  '동안구': { id: 'anyang', name: '안양시' },
  '상록구': { id: 'ansan', name: '안산시' },
  '단원구': { id: 'ansan', name: '안산시' },
  '덕양구': { id: 'goyang', name: '고양시' },
  '일산동구': { id: 'goyang', name: '고양시' },
  '일산서구': { id: 'goyang', name: '고양시' },
  '처인구': { id: 'yongin', name: '용인시' },
  '기흥구': { id: 'yongin', name: '용인시' },
  '수지구': { id: 'yongin', name: '용인시' },
  // 2013년 데이터에는 부천시 구가 있음
  '원미구': { id: 'bucheon', name: '부천시' },
  '소사구': { id: 'bucheon', name: '부천시' },
  '오정구': { id: 'bucheon', name: '부천시' },
};

// 시/군 이름 → ID 매핑
const CITY_NAME_TO_ID: Record<string, string> = {
  '수원시': 'suwon',
  '성남시': 'seongnam',
  '의정부시': 'uijeongbu',
  '안양시': 'anyang',
  '부천시': 'bucheon',
  '광명시': 'gwangmyeong',
  '평택시': 'pyeongtaek',
  '동두천시': 'dongducheon',
  '안산시': 'ansan',
  '고양시': 'goyang',
  '과천시': 'gwacheon',
  '구리시': 'guri',
  '남양주시': 'namyangju',
  '오산시': 'osan',
  '시흥시': 'siheung',
  '군포시': 'gunpo',
  '의왕시': 'uiwang',
  '하남시': 'hanam',
  '용인시': 'yongin',
  '파주시': 'paju',
  '이천시': 'icheon',
  '안성시': 'anseong',
  '김포시': 'gimpo',
  '화성시': 'hwaseong',
  '광주시': 'gwangju',
  '양주시': 'yangju',
  '포천시': 'pocheon',
  '여주시': 'yeoju',
  '여주군': 'yeoju', // 2013년에는 군
  '연천군': 'yeoncheon',
  '가평군': 'gapyeong',
  '양평군': 'yangpyeong',
};

// 코드 기반 도시 매핑 (표준 행정코드)
const STANDARD_CODE_MAP: Record<string, { id: string; name: string }> = {
  '4111': { id: 'suwon', name: '수원시' },
  '4113': { id: 'seongnam', name: '성남시' },
  '41150': { id: 'uijeongbu', name: '의정부시' },
  '4117': { id: 'anyang', name: '안양시' },
  '41190': { id: 'bucheon', name: '부천시' },
  '41195': { id: 'bucheon', name: '부천시' },
  '41210': { id: 'gwangmyeong', name: '광명시' },
  '41220': { id: 'pyeongtaek', name: '평택시' },
  '41250': { id: 'dongducheon', name: '동두천시' },
  '4127': { id: 'ansan', name: '안산시' },
  '4128': { id: 'goyang', name: '고양시' },
  '41290': { id: 'gwacheon', name: '과천시' },
  '41310': { id: 'guri', name: '구리시' },
  '41360': { id: 'namyangju', name: '남양주시' },
  '41370': { id: 'osan', name: '오산시' },
  '41390': { id: 'siheung', name: '시흥시' },
  '41410': { id: 'gunpo', name: '군포시' },
  '41430': { id: 'uiwang', name: '의왕시' },
  '41450': { id: 'hanam', name: '하남시' },
  '4146': { id: 'yongin', name: '용인시' },
  '41480': { id: 'paju', name: '파주시' },
  '41500': { id: 'icheon', name: '이천시' },
  '41550': { id: 'anseong', name: '안성시' },
  '41570': { id: 'gimpo', name: '김포시' },
  '41590': { id: 'hwaseong', name: '화성시' },
  '41610': { id: 'gwangju', name: '광주시' },
  '41630': { id: 'yangju', name: '양주시' },
  '41650': { id: 'pocheon', name: '포천시' },
  '41670': { id: 'yeoju', name: '여주시' },
  '41680': { id: 'yeoncheon', name: '연천군' },
  '41690': { id: 'gapyeong', name: '가평군' },
  '41730': { id: 'yangpyeong', name: '양평군' },
  '41800': { id: 'yangpyeong', name: '양평군' },
};

// 이름 또는 코드로 도시 정보 찾기
function resolveCity(
  name: string,
  code: string,
  system: 'standard' | 'kostat'
): { id: string; name: string } | null {
  // 1. 이름으로 직접 매칭 (시/군 단위)
  if (CITY_NAME_TO_ID[name]) {
    return { id: CITY_NAME_TO_ID[name], name };
  }

  // 2. 이름으로 구 → 시 매칭
  if (DISTRICT_TO_CITY[name]) {
    return DISTRICT_TO_CITY[name];
  }

  // 3. "시 구" 형식 처리 (예: "수원시 장안구")
  const parts = name.split(/\s+/);
  if (parts.length >= 2) {
    const cityPart = parts[0];
    const distPart = parts.slice(1).join(' ');

    if (CITY_NAME_TO_ID[cityPart]) {
      return { id: CITY_NAME_TO_ID[cityPart], name: cityPart };
    }
    if (DISTRICT_TO_CITY[distPart]) {
      return DISTRICT_TO_CITY[distPart];
    }
  }

  // 4. 표준 행정코드 기반 매칭
  if (system === 'standard' && code.length >= 4) {
    // 5자리 전체
    if (STANDARD_CODE_MAP[code]) return STANDARD_CODE_MAP[code];
    // 4자리 prefix
    const p4 = code.substring(0, 4);
    if (STANDARD_CODE_MAP[p4]) return STANDARD_CODE_MAP[p4];
    // 5자리 (0 패딩)
    const p3 = code.substring(0, 3) + '00';
    if (STANDARD_CODE_MAP[p3]) return STANDARD_CODE_MAP[p3];
  }

  // 5. 코드 prefix로 그룹핑 시도 (동일 4자리 prefix = 같은 시)
  // KOSTAT 코드도 앞 4자리로 그룹핑
  if (code.length >= 5) {
    const prefix4 = code.substring(0, 4);
    // 이름에서 시/군 추출 시도
    for (const [cityName, cityId] of Object.entries(CITY_NAME_TO_ID)) {
      if (name.includes(cityName.replace(/시$|군$/, ''))) {
        return { id: cityId, name: cityName };
      }
    }
    // 마지막 수단: prefix 기반 ID 생성
    return { id: `city_${prefix4}`, name: name };
  }

  return null;
}

// ====== 프로젝션 ======
function project(lon: number, lat: number): [number, number] {
  const centerLat = 37.5;
  const cosLat = Math.cos((centerLat * Math.PI) / 180);
  const x = (lon - 126.1) * 310 * cosLat;
  const y = (38.6 - lat) * 310;
  return [x, y];
}

function coordsToSvgPath(ring: number[][]): string {
  return (
    ring
      .map(([lon, lat], i) => {
        const [x, y] = project(lon, lat);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ') + ' Z'
  );
}

function featureToSvgPaths(feature: any): string[] {
  const geom = feature.geometry;
  const paths: string[] = [];

  if (geom.type === 'Polygon') {
    paths.push(coordsToSvgPath(geom.coordinates[0]));
  } else if (geom.type === 'MultiPolygon') {
    for (const polygon of geom.coordinates) {
      paths.push(coordsToSvgPath(polygon[0]));
    }
  }

  return paths;
}

function computeCenter(paths: string[], regionId?: string): { x: number; y: number } {
  // 각 폴리곤의 면적과 무게중심을 계산
  const polygons: { cx: number; cy: number; area: number }[] = [];

  for (const path of paths) {
    const coords: [number, number][] = [];
    const matches = path.matchAll(/(-?[\d.]+),(-?[\d.]+)/g);
    for (const m of matches) {
      coords.push([parseFloat(m[1]), parseFloat(m[2])]);
    }
    if (coords.length < 3) continue;

    // Shoelace formula
    let signedArea = 0;
    let cx = 0;
    let cy = 0;
    const n = coords.length;

    for (let i = 0; i < n; i++) {
      const [x0, y0] = coords[i];
      const [x1, y1] = coords[(i + 1) % n];
      const cross = x0 * y1 - x1 * y0;
      signedArea += cross;
      cx += (x0 + x1) * cross;
      cy += (y0 + y1) * cross;
    }

    signedArea *= 0.5;
    const area = Math.abs(signedArea);
    if (area <= 0) continue;

    const factor = 1 / (6 * signedArea);
    polygons.push({ cx: cx * factor, cy: cy * factor, area });
  }

  if (polygons.length === 0) return { x: 0, y: 0 };

  // 전체 면적 합산 → 작은 섬(전체의 5% 미만) 필터링
  const totalArea = polygons.reduce((sum, p) => sum + p.area, 0);
  const mainPolygons = polygons.filter(p => p.area >= totalArea * 0.05);
  const targets = mainPolygons.length > 0 ? mainPolygons : polygons;

  // 면적 가중 평균으로 전체 중심 계산 (여러 구를 합친 도시 중앙)
  const sumArea = targets.reduce((sum, p) => sum + p.area, 0);
  let finalX = targets.reduce((sum, p) => sum + p.cx * p.area, 0) / sumArea;
  let finalY = targets.reduce((sum, p) => sum + p.cy * p.area, 0) / sumArea;

  // 특정 지역 수동 보정 (지형 특성상 자동 계산만으로 부족한 경우)
  const MANUAL_OFFSETS: Record<string, { dx: number; dy: number }> = {
    ansan: { dx: 15, dy: -5 },   // 우측 + 위로 보정
  };
  if (regionId && MANUAL_OFFSETS[regionId]) {
    finalX += MANUAL_OFFSETS[regionId].dx;
    finalY += MANUAL_OFFSETS[regionId].dy;
  }

  return { x: finalX, y: finalY };
}

// ====== 데이터 가져오기 ======
async function fetchMapData(): Promise<any | null> {
  for (const url of DATA_URLS) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) continue;

      const data = await response.json();

      // GeoJSON
      if (data.type === 'FeatureCollection') {
        return data;
      }

      // TopoJSON
      if (data.type === 'Topology') {
        const objectKey = Object.keys(data.objects)[0];
        if (!objectKey) continue;
        const fc = topojson.feature(data, data.objects[objectKey]) as any;
        return fc;
      }
    } catch {
      continue;
    }
  }
  return null;
}

// ====== GeoJSON → 렌더링 데이터 변환 ======
function processGeoJsonData(fc: any): {
  gyeonggi: RenderedRegion[];
  seoul: RenderedRegion[];
  incheon: RenderedRegion[];
} {
  // 모든 코드 수집하여 코드 체계 판별
  const allCodes: string[] = [];
  for (const feature of fc.features) {
    const code = getFeatureCode(feature.properties);
    if (code) allCodes.push(code);
  }

  const system = detectProvinceSystem(allCodes);

  // 시/도별 분류 후 도시별 그룹핑
  const cityGroups: Record<
    string,
    { id: string; name: string; features: any[] }
  > = {};

  for (const feature of fc.features) {
    const code = getFeatureCode(feature.properties);
    const name = getFeatureName(feature.properties);
    if (!code && !name) continue;

    const province = code
      ? getProvinceType(code, system)
      : null;

    // 코드로 시도 판별 실패 시 이름으로 시도
    let finalProvince = province;
    if (!finalProvince && name) {
      // 이름에서 시도 추정
      if (name.includes('서울')) finalProvince = 'seoul';
      else if (name.includes('인천')) finalProvince = 'incheon';
      // 경기도 시/군 이름으로 체크
      else {
        const parts = name.split(/\s+/);
        const cityPart = parts[0];
        if (CITY_NAME_TO_ID[cityPart] || CITY_NAME_TO_ID[name]) {
          finalProvince = 'gyeonggi';
        }
        if (DISTRICT_TO_CITY[name] || DISTRICT_TO_CITY[parts[parts.length - 1]]) {
          finalProvince = 'gyeonggi';
        }
      }
    }

    if (!finalProvince) continue;
    if (!['gyeonggi', 'seoul', 'incheon'].includes(finalProvince)) continue;

    let groupKey: string;
    let groupName: string;
    let groupId: string;

    if (finalProvince === 'seoul') {
      groupKey = 'seoul';
      groupName = '서울';
      groupId = 'seoul';
    } else if (finalProvince === 'incheon') {
      groupKey = 'incheon';
      groupName = '인천';
      groupId = 'incheon';
    } else {
      // 경기도 - 도시별 그룹핑
      const city = resolveCity(name, code, system);
      if (!city) continue;
      groupKey = `gyeonggi_${city.id}`;
      groupName = city.name;
      groupId = city.id;
    }

    if (!cityGroups[groupKey]) {
      cityGroups[groupKey] = { id: groupId, name: groupName, features: [] };
    }
    cityGroups[groupKey].features.push(feature);
  }

  // 렌더링 데이터로 변환
  const gyeonggi: RenderedRegion[] = [];
  const seoul: RenderedRegion[] = [];
  const incheon: RenderedRegion[] = [];

  for (const [key, group] of Object.entries(cityGroups)) {
    const allPaths: string[] = [];
    for (const feature of group.features) {
      allPaths.push(...featureToSvgPaths(feature));
    }

    if (allPaths.length === 0) continue;

    const region: RenderedRegion = {
      id: group.id,
      name: group.name,
      paths: allPaths,
      center: computeCenter(allPaths, group.id),
      isClickable: key.startsWith('gyeonggi_'),
    };

    if (key === 'seoul') {
      seoul.push(region);
    } else if (key === 'incheon') {
      incheon.push(region);
    } else {
      gyeonggi.push(region);
    }
  }

  return { gyeonggi, seoul, incheon };
}

// ====== 폴 데이터 변환 ======
const FALLBACK_PROJECTION = {
  originLon: 126.1,
  originLat: 38.6,
  scaleX: 310,
  scaleY: 390,
};

function getFallbackData(): {
  gyeonggi: RenderedRegion[];
  seoul: RenderedRegion[];
  incheon: RenderedRegion[];
} {
  const gyeonggi = fallbackRegions.map((r) => {
    const points = projectCoords(r.coords, FALLBACK_PROJECTION);
    const center = getPolygonCenter(r.coords, FALLBACK_PROJECTION);
    const pathD =
      'M' +
      points
        .split(' ')
        .map((p) => p.replace(',', ','))
        .join(' L') +
      ' Z';
    return {
      id: r.id,
      name: r.name,
      paths: [pathD],
      center,
      isClickable: true,
    };
  });

  return {
    gyeonggi,
    seoul: [],
    incheon: [],
  };
}

// ====== viewBox 자동 계산 ======
function computeViewBox(regions: RenderedRegion[]): string {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const region of regions) {
    for (const path of region.paths) {
      const matches = path.matchAll(/(-?[\d.]+),(-?[\d.]+)/g);
      for (const m of matches) {
        const x = parseFloat(m[1]);
        const y = parseFloat(m[2]);
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  const padding = 15;
  return `${(minX - padding).toFixed(0)} ${(minY - padding).toFixed(0)} ${(maxX - minX + padding * 2).toFixed(0)} ${(maxY - minY + padding * 2).toFixed(0)}`;
}

// ====== 컴포넌트 ======
export function GyeonggiMap({
  onRegionClick,
  selectedRegion,
  electionRecords,
  onSelectedRegionData,
  autoHighlightRegion,
  autoElectionRecords,
  autoFade,
  autoProgressPercent,
  autoProgressLabel,
  isAutoRotating,
  onToggleAutoRotate,
  onPrevRegion,
  onNextRegion,
  onResetAutoRotate,
}: GyeonggiMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [mapData, setMapData] = useState<{
    gyeonggi: RenderedRegion[];
    seoul: RenderedRegion[];
    incheon: RenderedRegion[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'github' | 'fallback'>('fallback');

  // 선택된 지역 이름 조회
  const selectedRegionName = useMemo(() => {
    const found = ALL_REGIONS.find(r => r.id === selectedRegion);
    return found?.name || '';
  }, [selectedRegion]);

  // 데이터 로드
  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      try {
        const fc = await fetchMapData();
        if (cancelled) return;
        if (fc) {
          const processed = processGeoJsonData(fc);
          if (processed.gyeonggi.length > 0) {
            setMapData(processed);
            setDataSource('github');
            setLoading(false);
            return;
          }
        }
      } catch { /* fetch 실패 시 폴백 */ }
      if (cancelled) return;
      setMapData(getFallbackData());
      setDataSource('fallback');
      setLoading(false);
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  // viewBox 계산
  const fullViewBox = useMemo(() => {
    if (!mapData) return '0 0 500 600';
    return computeViewBox(mapData.gyeonggi);
  }, [mapData]);

  // 선택된 지역의 확대 viewBox (상단 미리보기용)
  const selectedViewBox = useMemo(() => {
    if (!mapData || !selectedRegion) return null;
    const region = mapData.gyeonggi.find((r) => r.id === selectedRegion);
    if (!region) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const path of region.paths) {
      const matches = path.matchAll(/(-?[\d.]+),(-?[\d.]+)/g);
      for (const m of matches) {
        const x = parseFloat(m[1]);
        const y = parseFloat(m[2]);
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }

    const regionW = maxX - minX;
    const regionH = maxY - minY;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const padding = Math.max(regionW, regionH) * 0.3;
    const vbW = regionW + padding * 2;
    const vbH = regionH + padding * 2;

    return {
      viewBox: `${(cx - (regionW / 2 + padding)).toFixed(0)} ${(cy - (regionH / 2 + padding)).toFixed(0)} ${vbW.toFixed(0)} ${vbH.toFixed(0)}`,
    };
  }, [mapData, selectedRegion]);

  // 자동 순회 지역의 확대 viewBox + 데이터
  const autoViewBox = useMemo(() => {
    if (!mapData || !autoHighlightRegion || selectedRegion) return null;
    const region = mapData.gyeonggi.find((r) => r.id === autoHighlightRegion);
    if (!region) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const path of region.paths) {
      const matches = path.matchAll(/(-?[\d.]+),(-?[\d.]+)/g);
      for (const m of matches) {
        const x = parseFloat(m[1]);
        const y = parseFloat(m[2]);
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }

    const regionW = maxX - minX;
    const regionH = maxY - minY;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const padding = Math.max(regionW, regionH) * 0.3;
    const vbW = regionW + padding * 2;
    const vbH = regionH + padding * 2;

    return {
      viewBox: `${(cx - (regionW / 2 + padding)).toFixed(0)} ${(cy - (regionH / 2 + padding)).toFixed(0)} ${vbW.toFixed(0)} ${vbH.toFixed(0)}`,
      region,
    };
  }, [mapData, autoHighlightRegion, selectedRegion]);

  // 자동 순회 지역 이름
  const autoRegionName = useMemo(() => {
    const found = ALL_REGIONS.find(r => r.id === autoHighlightRegion);
    return found?.name || '';
  }, [autoHighlightRegion]);

  // viewBox 너비에 비례한 글자 크기 (데이터소스 무관하게 시각적 일관성 유지)
  const getTextSize = useCallback(
    (_regionId: string): number => {
      const vbParts = fullViewBox.split(' ');
      const vbW = parseFloat(vbParts[2]);
      // viewBox 너비의 약 3%를 기본 텍스트 크기로 사용
      return vbW * 0.03;
    },
    [fullViewBox]
  );

  // 지도 표시용 라벨: "시"/"군" 제거하여 최대한 축소
  const getMapLabel = useCallback((name: string): string => {
    return name.replace(/[시군]$/g, '');
  }, []);

  // 클릭 핸들러 (선택된 지역 다시 클릭 시 해제)
  const handleRegionClick = useCallback(
    (regionId: string, regionName: string) => {
      if (selectedRegion === regionId) {
        onRegionClick('', '');
      } else {
        onRegionClick(regionId, regionName);
      }
    },
    [selectedRegion, onRegionClick]
  );

  // 선택된 지역 데이터를 부모에게 전달
  useEffect(() => {
    if (!onSelectedRegionData) return;
    if (!mapData || !selectedRegion) {
      onSelectedRegionData(null);
      return;
    }
    const region = mapData.gyeonggi.find((r) => r.id === selectedRegion);
    if (!region || !selectedViewBox) {
      onSelectedRegionData(null);
      return;
    }
    onSelectedRegionData({ paths: region.paths, viewBox: selectedViewBox.viewBox });
  }, [mapData, selectedRegion, selectedViewBox, onSelectedRegionData]);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#003da5] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">지도 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!mapData) return null;

  const strokeWidth = dataSource === 'github' ? 0.35 : 1.2;
  const selectedStrokeWidth = dataSource === 'github' ? 0.3 : 1;

  // 선택된 지역 데이터
  const selectedRegionData = selectedRegion
    ? mapData.gyeonggi.find((r) => r.id === selectedRegion)
    : null;

  // 실제 표시할 hover 상태: 수동 hover > autoHighlight
  const effectiveHover = hoveredRegion || (selectedRegion ? null : autoHighlightRegion) || null;
  const isManualHover = !!hoveredRegion;

  // 8대·7대 선거 결과
  const record8 = electionRecords?.find(r => r.generation === 8);
  const record7 = electionRecords?.find(r => r.generation === 7);

  // 자동 순회 시 역대 전적
  const autoRecord8 = autoElectionRecords?.find(r => r.generation === 8);
  const autoRecord7 = autoElectionRecords?.find(r => r.generation === 7);
  const showAutoElection = !selectedRegion && autoHighlightRegion;

  return (
    <div className="w-full flex-1 flex flex-col min-h-0">
      {/* ===== 자동 순회 역대 전적 (지도 상단, 수동 선택과 동일 형태) ===== */}
      {showAutoElection && autoViewBox && (
        <div
          className="relative mb-3 rounded-lg overflow-hidden border border-gray-200 bg-gradient-to-b from-[#f0f5fb] to-white"
          style={{ height: '220px' }}
        >
          {/* 지역 이름 라벨 - 페이드 애니메이션 */}
          <div className="absolute top-3 left-3 z-10 transition-opacity duration-500 ease-in-out" style={{ opacity: autoFade ? 1 : 0 }}>
            <span
              className="inline-flex items-center justify-center px-3 rounded-full text-white text-[12px]"
              style={{ background: 'linear-gradient(135deg, #003da5, #2fa4e7)', fontWeight: 700, minWidth: '52px', textAlign: 'center', height: '30px', lineHeight: 1 }}
            >
              {autoRegionName}
            </span>
          </div>

          {/* 2/3 지도 + 1/3 선거결과 */}
          <div className="flex items-stretch h-full">
            {/* 좌측: 지도 - 페이드 애니메이션 */}
            <div className="relative flex-[3] min-w-0 flex items-center justify-center transition-opacity duration-500 ease-in-out" style={{ opacity: autoFade ? 1 : 0 }}>
              <svg
                viewBox={autoViewBox.viewBox}
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <filter id="auto-detail-shadow" x="-10%" y="-10%" width="130%" height="130%">
                    <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#003da5" floodOpacity="0.25" />
                  </filter>
                </defs>
                {autoViewBox.region.paths.map((path, i) => (
                  <path
                    key={`auto-detail-${i}`}
                    d={path}
                    fill="#003da5"
                    stroke="#003da5"
                    strokeWidth={selectedStrokeWidth}
                    strokeLinejoin="round"
                    filter="url(#auto-detail-shadow)"
                  />
                ))}
                {/* 지도 위 지역명 텍스트 */}
                <text
                  x={autoViewBox.region.center.x + (PREVIEW_TEXT_OFFSETS[autoHighlightRegion!]?.dx || 0)}
                  y={autoViewBox.region.center.y + (PREVIEW_TEXT_OFFSETS[autoHighlightRegion!]?.dy || 0)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={(() => {
                    const vbParts = autoViewBox.viewBox.split(' ');
                    const vbW = parseFloat(vbParts[2]);
                    const vbH = parseFloat(vbParts[3]);
                    // meet 스케일링 보정: max(vbW, vbH) 기준으로 일관된 시각적 크기 산출
                    return Math.max(vbW, vbH) * 0.08;
                  })()}
                  fontWeight={700}
                  opacity={0.85}
                  style={{ pointerEvents: 'none' }}
                >
                  {getMapLabel(autoRegionName)}
                </text>
              </svg>
            </div>

            {/* 우측: 선거 결과 */}
            <div className="flex-[2] flex flex-col p-3 min-w-0">
              {/* 자동 순회 인디케이터 (네비게이션 - 고정) */}
              <div className="flex justify-end mb-2">
                {autoProgressPercent !== undefined && autoProgressLabel ? (
                  <div className="flex items-center gap-1.5">
                    {/* 이전 버튼 */}
                    {onPrevRegion && (
                      <button
                        onClick={onPrevRegion}
                        className="bg-white/90 hover:bg-white border border-gray-300 rounded-full p-1.5 shadow-md cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
                        title="이전 지역"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#003da5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </button>
                    )}
                    {/* 일시정지/재생 버튼 (< 와 > 사이) */}
                    {onToggleAutoRotate && (
                      <button
                        onClick={onToggleAutoRotate}
                        className="bg-white/90 hover:bg-white border border-gray-300 rounded-full p-1.5 shadow-md cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
                        title={isAutoRotating ? '일시정지' : '재생'}
                      >
                        {isAutoRotating ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="#003da5" stroke="none">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="#003da5" stroke="none">
                            <polygon points="6,4 20,12 6,20" />
                          </svg>
                        )}
                      </button>
                    )}
                    {/* 다음 버튼 */}
                    {onNextRegion && (
                      <button
                        onClick={onNextRegion}
                        className="bg-white/90 hover:bg-white border border-gray-300 rounded-full p-1.5 shadow-md cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
                        title="다음 지역"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#003da5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    )}
                    {/* 되돌아가기 버튼 */}
                    <button
                      onClick={() => onResetAutoRotate ? onResetAutoRotate() : onRegionClick('', '')}
                      className="bg-white/90 hover:bg-white border border-gray-300 rounded-full p-1.5 shadow-md cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
                      title="처음으로 되돌아가기"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#003da5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="p-1.5" style={{ width: '28px', height: '28px' }} />
                )}
              </div>

              {/* 선거 결과 카드들 - 페이드 애니메이션 */}
              <div className="flex flex-col gap-2 flex-1 justify-end min-w-0 transition-opacity duration-500 ease-in-out" style={{ opacity: autoFade ? 1 : 0 }}>
                {autoRecord8 && (
                  <div
                    className="rounded-md px-2 py-1.5"
                    style={{ backgroundColor: `${autoRecord8.color}08`, border: `1px solid ${autoRecord8.color}25` }}
                  >
                    <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600, marginBottom: '2px' }}>
                      {autoRecord8.generation}대({autoRecord8.year})
                    </div>
                    <div className="flex items-center gap-1 whitespace-nowrap" style={{ marginBottom: '1px' }}>
                      <span className="inline-block rounded-full shrink-0" style={{ width: '6px', height: '6px', backgroundColor: autoRecord8.color }} />
                      <span className="truncate" style={{ fontSize: '11px', color: autoRecord8.color, fontWeight: 700 }}>{autoRecord8.party}</span>
                      <span style={{ fontSize: '11px', color: '#111827', fontWeight: 700 }}>{autoRecord8.voteShare}%</span>
                    </div>
                    <div className="whitespace-nowrap" style={{ fontSize: '10px', color: '#6b7280', fontWeight: 500 }}>
                      투표율 {autoRecord8.turnout}%&nbsp;&nbsp;{autoRecord8.voteMargin.toFixed(1)}%p차
                    </div>
                  </div>
                )}
                {autoRecord7 && (
                  <div
                    className="rounded-md px-2 py-1.5"
                    style={{ backgroundColor: `${autoRecord7.color}08`, border: `1px solid ${autoRecord7.color}25` }}
                  >
                    <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600, marginBottom: '2px' }}>
                      {autoRecord7.generation}대({autoRecord7.year})
                    </div>
                    <div className="flex items-center gap-1 whitespace-nowrap" style={{ marginBottom: '1px' }}>
                      <span className="inline-block rounded-full shrink-0" style={{ width: '6px', height: '6px', backgroundColor: autoRecord7.color }} />
                      <span className="truncate" style={{ fontSize: '11px', color: autoRecord7.color, fontWeight: 700 }}>{autoRecord7.party}</span>
                      <span style={{ fontSize: '11px', color: '#111827', fontWeight: 700 }}>{autoRecord7.voteShare}%</span>
                    </div>
                    <div className="whitespace-nowrap" style={{ fontSize: '10px', color: '#6b7280', fontWeight: 500 }}>
                      투표율 {autoRecord7.turnout}%&nbsp;&nbsp;{autoRecord7.voteMargin.toFixed(1)}%p차
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 프로그레스 바 + 카운터 (지도 영역 하단 중앙, 페이드 영향 없음) */}
          {autoProgressPercent !== undefined && autoProgressLabel && (
            <div className="absolute bottom-1.5 left-0 z-10 flex items-center justify-center pointer-events-none" style={{ width: '60%' }}>
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1 bg-gray-300/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${autoProgressPercent}%`, background: 'linear-gradient(90deg, #43e8d8, #2fa4e7)' }}
                  />
                </div>
                <span className="text-[11px] text-gray-400 text-center" style={{ fontWeight: 500, width: '36px', fontVariantNumeric: 'tabular-nums' }}>
                  {autoProgressLabel}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== 상단: 선택된 지역 미리보기 (2/3 지도 + 1/3 선거결과) ===== */}
      {selectedRegionData && selectedViewBox && (
        <div className="relative mb-3 rounded-lg overflow-hidden border border-gray-200 bg-gradient-to-b from-[#f0f5fb] to-white" style={{ height: '220px' }}>
          {/* 지역 이름 라벨 */}
          <div className="absolute top-3 left-3 z-10">
            <span
              className="inline-flex items-center justify-center px-3 rounded-full text-white text-[12px]"
              style={{ background: 'linear-gradient(135deg, #003da5, #2fa4e7)', fontWeight: 700, minWidth: '52px', textAlign: 'center', height: '30px', lineHeight: 1 }}
            >
              {selectedRegionName}
            </span>
          </div>

          {/* 2/3 지도 + 1/3 선거결과 */}
          <div className="flex items-stretch h-full">
            {/* 좌측: 지도 */}
            <div className="relative flex-[3] min-w-0 flex items-center justify-center">
              <svg
                viewBox={selectedViewBox.viewBox}
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <filter id="detail-shadow" x="-10%" y="-10%" width="130%" height="130%">
                    <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#003da5" floodOpacity="0.25" />
                  </filter>
                </defs>
                {selectedRegionData.paths.map((path, i) => (
                  <path
                    key={`detail-${i}`}
                    d={path}
                    fill="#003da5"
                    stroke="#003da5"
                    strokeWidth={selectedStrokeWidth}
                    strokeLinejoin="round"
                    filter="url(#detail-shadow)"
                  />
                ))}
                {/* 지도 위 지역명 텍스트 */}
                <text
                  x={selectedRegionData.center.x + (PREVIEW_TEXT_OFFSETS[selectedRegion!]?.dx || 0)}
                  y={selectedRegionData.center.y + (PREVIEW_TEXT_OFFSETS[selectedRegion!]?.dy || 0)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={(() => {
                    const vbParts = selectedViewBox.viewBox.split(' ');
                    const vbW = parseFloat(vbParts[2]);
                    const vbH = parseFloat(vbParts[3]);
                    // meet 스케일링 보정: max(vbW, vbH) 기준으로 일관된 시각적 크기 산출
                    return Math.max(vbW, vbH) * 0.08;
                  })()}
                  fontWeight={700}
                  opacity={0.85}
                  style={{ pointerEvents: 'none' }}
                >
                  {getMapLabel(selectedRegionName)}
                </text>
              </svg>
            </div>

            {/* 우측: 선거 결과 + 되돌리기 버튼 */}
            <div className="flex-[2] flex flex-col p-3 min-w-0">
              {/* 되돌리기 버튼 (우상단) */}
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => onRegionClick('', '')}
                  className="bg-white/90 hover:bg-white border border-gray-300 rounded-full p-1.5 shadow-md cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
                  title="전체 지도로 돌아가기"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#003da5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                </button>
              </div>

              {/* 선거 결과 카드들 */}
              <div className="flex flex-col gap-2 flex-1 justify-end min-w-0">
                {record8 && (
                  <div
                    className="rounded-md px-2 py-1.5"
                    style={{ backgroundColor: `${record8.color}08`, border: `1px solid ${record8.color}25` }}
                  >
                    <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600, marginBottom: '2px' }}>
                      {record8.generation}대({record8.year})
                    </div>
                    <div className="flex items-center gap-1 whitespace-nowrap" style={{ marginBottom: '1px' }}>
                      <span
                        className="inline-block rounded-full shrink-0"
                        style={{ width: '6px', height: '6px', backgroundColor: record8.color }}
                      />
                      <span className="truncate" style={{ fontSize: '11px', color: record8.color, fontWeight: 700 }}>
                        {record8.party}
                      </span>
                      <span style={{ fontSize: '11px', color: '#111827', fontWeight: 700 }}>
                        {record8.voteShare}%
                      </span>
                    </div>
                    <div className="whitespace-nowrap" style={{ fontSize: '10px', color: '#6b7280', fontWeight: 500 }}>
                      투표율 {record8.turnout}%&nbsp;&nbsp;{record8.voteMargin.toFixed(1)}%p차
                    </div>
                  </div>
                )}
                {record7 && (
                  <div
                    className="rounded-md px-2 py-1.5"
                    style={{ backgroundColor: `${record7.color}08`, border: `1px solid ${record7.color}25` }}
                  >
                    <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600, marginBottom: '2px' }}>
                      {record7.generation}대({record7.year})
                    </div>
                    <div className="flex items-center gap-1 whitespace-nowrap" style={{ marginBottom: '1px' }}>
                      <span
                        className="inline-block rounded-full shrink-0"
                        style={{ width: '6px', height: '6px', backgroundColor: record7.color }}
                      />
                      <span className="truncate" style={{ fontSize: '11px', color: record7.color, fontWeight: 700 }}>
                        {record7.party}
                      </span>
                      <span style={{ fontSize: '11px', color: '#111827', fontWeight: 700 }}>
                        {record7.voteShare}%
                      </span>
                    </div>
                    <div className="whitespace-nowrap" style={{ fontSize: '10px', color: '#6b7280', fontWeight: 500 }}>
                      투표율 {record7.turnout}%&nbsp;&nbsp;{record7.voteMargin.toFixed(1)}%p차
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 전체 지도 (항상 표시, 탐색용) ===== */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <svg
          viewBox={fullViewBox}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="shadow" x="-5%" y="-5%" width="120%" height="120%">
              <feDropShadow dx="0.5" dy="0.5" stdDeviation="1" floodColor="#003da5" floodOpacity="0.3" />
            </filter>
            <filter id="glow" x="-5%" y="-5%" width="120%" height="120%">
              <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#4d8fd6" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* 히트 영역 */}
          {mapData.gyeonggi.map((region) => (
            <g key={`hit-${region.id}`}>
              {region.paths.map((path, i) => (
                <path
                  key={`hit-${region.id}-${i}`}
                  d={path}
                  fill="transparent"
                  stroke="none"
                  className="cursor-pointer"
                  onClick={() => handleRegionClick(region.id, region.name)}
                  onMouseEnter={() => setHoveredRegion(region.id)}
                  onMouseLeave={() => setHoveredRegion(null)}
                />
              ))}
            </g>
          ))}

          {/* 경기도 각 시·군 - 1차: path만 렌더링 (호버 지역 제외) */}
          {[...mapData.gyeonggi]
            .filter((region) => !(isManualHover && effectiveHover === region.id))
            .sort((a, b) => {
              const aTop = a.id === selectedRegion ? 1 : 0;
              const bTop = b.id === selectedRegion ? 1 : 0;
              return aTop - bTop;
            })
            .map((region) => {
            const isSelected = selectedRegion === region.id;
            const isHovered = effectiveHover === region.id;
            const hasSelection = !!selectedRegion;
            const isFaded = hasSelection && !isSelected && !isHovered;

            const fillColor = isSelected
              ? '#003da5'
              : isHovered
                ? '#5ab8f0'
                : '#edf2f7';

            return (
              <g
                key={region.id}
                style={{
                  pointerEvents: 'none',
                  transition: 'opacity 0.35s ease',
                  opacity: isFaded ? 0.25 : 1,
                }}
              >
                {region.paths.map((path, i) => (
                  <path
                    key={`${region.id}-${i}`}
                    d={path}
                    fill={fillColor}
                    stroke={fillColor}
                    strokeWidth={isSelected ? selectedStrokeWidth : strokeWidth}
                    strokeLinejoin="round"
                    style={{ transition: 'fill 0.3s ease, stroke 0.3s ease' }}
                    filter={
                      isSelected
                        ? 'url(#shadow)'
                        : isHovered
                          ? 'url(#glow)'
                          : undefined
                    }
                  />
                ))}
              </g>
            );
          })}

          {/* 경기도 각 시·군 - 2차: 텍스트 라벨만 렌더링 (호버 지역 제외) */}
          {mapData.gyeonggi
            .filter((region) => !(isManualHover && effectiveHover === region.id))
            .map((region) => {
            const isSelected = selectedRegion === region.id;
            const isHovered = effectiveHover === region.id;
            const hasSelection = !!selectedRegion;
            const isFaded = hasSelection && !isSelected && !isHovered;
            const textColor = isSelected || isHovered ? '#ffffff' : '#4a5568';

            return (
              <text
                key={`label-${region.id}`}
                x={region.center.x}
                y={region.center.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="select-none"
                fill={textColor}
                fontSize={getTextSize(region.id)}
                fontWeight={isSelected ? 700 : 500}
                style={{
                  pointerEvents: 'none',
                  transition: 'fill 0.3s ease, opacity 0.35s ease',
                  opacity: isFaded ? 0.25 : 1,
                }}
              >
                {getMapLabel(region.name)}
              </text>
            );
          })}

          {/* 3차: 수동 호버된 지역 (path + 라벨) - 최상위 레이어 */}
          {isManualHover && effectiveHover && (() => {
            const region = mapData.gyeonggi.find(r => r.id === effectiveHover);
            if (!region) return null;
            const isSelected = selectedRegion === region.id;
            const cx = region.center.x;
            const cy = region.center.y;
            const targetScale = isSelected ? 1 : 2;
            // 고유 애니메이션 이름 (지역별로 다른 transform-origin)
            const animId = `zoom-${effectiveHover}`;
            return (
              <>
                {!isSelected && (
                  <defs>
                    <style>{`
                      @keyframes ${animId} {
                        from { transform: scale(1); }
                        to { transform: scale(${targetScale}); }
                      }
                    `}</style>
                  </defs>
                )}
                <g
                  style={{
                    pointerEvents: 'none',
                    transformOrigin: `${cx}px ${cy}px`,
                    ...(isSelected ? {} : {
                      animation: `${animId} 0.3s cubic-bezier(0.25, 0.1, 0.25, 1) forwards`,
                    }),
                  }}
                >
                  {region.paths.map((path, i) => (
                    <path
                      key={`hover-${region.id}-${i}`}
                      d={path}
                      fill={isSelected ? '#003da5' : '#5ab8f0'}
                      stroke={isSelected ? '#003da5' : '#5ab8f0'}
                      strokeWidth={(isSelected ? selectedStrokeWidth : strokeWidth) / targetScale}
                      strokeLinejoin="round"
                      filter={isSelected ? 'url(#shadow)' : 'url(#glow)'}
                    />
                  ))}
                  <text
                    x={region.center.x}
                    y={region.center.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="select-none"
                    fill="#ffffff"
                    fontSize={getTextSize(region.id) * 1.5 / targetScale}
                    fontWeight={isSelected ? 700 : 500}
                    style={{ pointerEvents: 'none' }}
                  >
                    {getMapLabel(region.name)}
                  </text>
                </g>
              </>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}