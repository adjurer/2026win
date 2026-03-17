// 후보자 데이터 타입 정의
export interface Candidate {
  id: string;
  regionId: string;
  regionName: string;
  name: string;
  nameHanja?: string;
  imageUrl: string;
  catchphrase: string;
  tags: string[];
  pledgeSummary: string;
  personality: string;
  // 상세 페이지용
  birthday?: string;
  age?: string;
  career?: string[];
  education?: string[];
  pledges?: string[];
  keyPledge?: string;    // 주요 공약 원문 (CSV key_pledge)
  fullPledge?: string;   // 전체 공약 원문 (CSV full_pledge)
  occupation?: string;
  gender?: string;
  necDetailUrl?: string;
  sns?: {
    youtube?: string;
    instagram?: string;
    facebook?: string;
    blog?: string;
  };
  interviewVideo?: string;
  debateVideo?: string;
  speechVideo?: string;
  address?: string;
}

// 지역명 → regionId 매핑
const DISTRICT_TO_REGION: Record<string, string> = {
  '가평군': 'gapyeong',
  '고양시': 'goyang',
  '과천시': 'gwacheon',
  '광명시': 'gwangmyeong',
  '광주시': 'gwangju',
  '구리시': 'guri',
  '군포시': 'gunpo',
  '김포시': 'gimpo',
  '남양주시': 'namyangju',
  '동두천시': 'dongducheon',
  '부천시': 'bucheon',
  '성남시': 'seongnam',
  '수원시': 'suwon',
  '시흥시': 'siheung',
  '안산시': 'ansan',
  '안성시': 'anseong',
  '안양시': 'anyang',
  '양주시': 'yangju',
  '양평군': 'yangpyeong',
  '여주시': 'yeoju',
  '연천군': 'yeoncheon',
  '오산시': 'osan',
  '용인시': 'yongin',
  '의왕시': 'uiwang',
  '의정부시': 'uijeongbu',
  '이천시': 'icheon',
  '파주시': 'paju',
  '평택시': 'pyeongtaek',
  '포천시': 'pocheon',
  '하남시': 'hanam',
  '화성시': 'hwaseong',
};

// 경력 문자열을 개별 항목으로 분리
function parseCareer(careerStr: string): string[] {
  if (!careerStr) return [];
  // "(전)" 또는 "(현)" 앞에서 분리
  const items = careerStr
    .split(/\s+(?=\(전\)|\(현\))/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  return items;
}

// 이름에서 한자 제거: "김민주 (金民柱)" → "김민주"
function parseName(nameHanja: string): string {
  return nameHanja.replace(/\s*\(.*?\)\s*$/, '').trim();
}

// 이름에서 한자만 추출: "김민주 (金民柱)" → "金民柱"
function extractHanja(nameHanja: string): string {
  const match = nameHanja.match(/\(([^)]+)\)/);
  return match ? match[1] : '';
}

// 생년월일에서 날짜와 나이 분리: "1970.12.23 (55세)" → { birthday: "1970.12.23", age: "55세" }
function parseBirthAge(birthAge: string): { birthday: string; age: string } {
  const match = birthAge.match(/^([\d.]+)\s*\((\d+세)\)$/);
  if (match) {
    return { birthday: match[1], age: match[2] };
  }
  return { birthday: birthAge, age: '' };
}

// 직업에서 키워드 태그 추출
function generateTags(occupation: string, career: string): string[] {
  const tags: string[] = [];
  const combined = occupation + ' ' + career;

  if (/변호사|법률|법학/.test(combined)) tags.push('법률전문가');
  if (/의원|의회|의장/.test(combined)) tags.push('의정활동');
  if (/시장|부시장|국장/.test(combined)) tags.push('행정경험');
  if (/교수|연구|박사/.test(combined)) tags.push('전문성');
  if (/경제|기업|산업/.test(combined)) tags.push('경제');
  if (/복지|돌봄|사회/.test(combined)) tags.push('복지');
  if (/교육|학교/.test(combined)) tags.push('교육');
  if (/환경|녹색/.test(combined)) tags.push('환경');
  if (/청년|미래/.test(combined)) tags.push('청년정책');
  if (/도시|개발|건설/.test(combined)) tags.push('도시개발');
  if (/문화|예술/.test(combined)) tags.push('문화예술');
  if (/노동|노무/.test(combined)) tags.push('노동');
  if (/세무|회계/.test(combined)) tags.push('재정');
  if (/농업|농/.test(combined)) tags.push('농업');

  // 최소 2개 태그 보장
  if (tags.length === 0) tags.push('지역발전');
  if (tags.length < 2) tags.push('시민소통');
  if (tags.length < 3) tags.push('민생');

  return tags.slice(0, 3);
}

// 중앙선관위 CSV 기반 더불어민주당 후보자 원본 데이터
interface RawCandidate {
  district: string;
  photoUrl: string;
  nameHanja: string;
  detailUrl: string;
  gender: string;
  birthAge: string;
  address?: string;
  occupation: string;
  education: string;
  career: string;
}

const RAW_CANDIDATES: RawCandidate[] = [
  // 고양시 (10명)
  { district: '고양시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4120/Hb100154190/gicho/thumbnail.100154190.JPG?ver=1993528', nameHanja: '명재성 (明在聲)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154190', gender: '남', birthAge: '1963.02.15 (63세)', occupation: '정당인', education: '국민대학교 정치대학원 졸업(정치학석사)', career: '(전) 고양시덕양구청장 (현)더불어민주당 정책위부의장' },
  { district: '고양시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4120/Hb100155611/gicho/thumbnail.100155611.JPG?ver=1996716', nameHanja: '민경선 (閔敬善)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100155611', gender: '남', birthAge: '1971.02.06 (55세)', occupation: '정당인', education: '서강대학교 경제대학원 졸업(경제학 석사)', career: '(현)더불어민주당 정청래 당대표 특별보좌역 정책특보 (현)더불어민주당 정책위원회 부의장' },
  { district: '고양시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4120/Hb100155019/gicho/thumbnail.100155019.JPG?ver=1993494', nameHanja: '백수회 (白壽會)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100155019', gender: '남', birthAge: '1972.12.22 (53세)', occupation: '변호사', education: '한양대학교 법학과 4학년 재적', career: '(전) 행정안전부 고문변호사 (현) 법률사무소 정상 대표 변호사' },
  { district: '고양시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4120/Hb100154181/gicho/thumbnail.100154181.JPG?ver=1991984', nameHanja: '윤종은 (尹鐘殷)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154181', gender: '남', birthAge: '1959.01.18 (67세)', occupation: '정당인', education: '서울대학교 영어영문학과 졸업', career: '(전)더불어민주당 홍보위원회 부위원장 (현)민주사회혁신포럼 상임대표' },
  { district: '고양시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4120/Hb100156990/gicho/thumbnail.100156990.JPG?ver=2004360', nameHanja: '이경혜 (李敬惠)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100156990', gender: '여', birthAge: '1965.10.15 (60세)', occupation: '정당인', education: '연세대학교 행정대학원 졸업(행정학석사)', career: '(전)제11대 경기도의회 기획재정위원회부위원장 (현)더불어민주당 정책위원회 부의장' },
  { district: '고양시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4120/Hb100156008/gicho/thumbnail.100156008.JPG?ver=1999009', nameHanja: '이영아 (李英兒)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100156008', gender: '여', birthAge: '1967.11.21 (58세)', occupation: '정당인', education: '연세대학교 언론홍보대학원 졸업(문학석사)', career: '(전)고양신문 대표 (현)더불어민주당 부대변인' },
  { district: '고양시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4120/Hb100155629/gicho/thumbnail.100155629.JPG?ver=1996791', nameHanja: '장제환 (張齊桓)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100155629', gender: '남', birthAge: '1967.10.30 (58세)', occupation: '(주)중앙종합안전기술 안전진단 본부장', education: '서울시립대학교 대학원 도시공학과 졸업(공학박사)', career: '(현)더불어민주당 정책위 부의장 (현)서울시립대 도시공학박사' },
  { district: '고양시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4120/Hb100154179/gicho/thumbnail.100154179.JPEG?ver=2005829', nameHanja: '정병춘 (鄭炳春)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154179', gender: '남', birthAge: '1960.10.09 (65세)', occupation: '정당인', education: '서울산업대학교(현 서울과학기술대학교) 산업대학원 졸업(공학석사)', career: '(현) 더불어민주당 당대표 특별보좌역 경제특보 (현) 더불어민주당 정책위원회 부의장' },
  { district: '고양시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4120/Hb100157365/gicho/thumbnail.100157365.JPG?ver=2006662', nameHanja: '최상봉 (崔相奉)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100157365', gender: '남', birthAge: '1965.09.06 (60세)', occupation: '정당인', education: '고려대학교 정치외교학과 졸업', career: '(전)경기도경제과학진흥원 이사 (현)더불어민주당 정책위부의장' },
  { district: '고양시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4120/Hb100158274/gicho/thumbnail.100158274.JPG?ver=2012136', nameHanja: '최승원 (崔承源)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100158274', gender: '남', birthAge: '1975.06.04 (51세)', occupation: '정당인', education: '연세대학교 공학대학원 도시계획전공 졸업(공학석사)', career: '(전)우원식 국회의장 정무기획비서관 (전)이재명 정부 국토교통부 장관정책보좌관' },
  // 과천시 (2명)
  { district: '과천시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4123/Hb100157110/gicho/thumbnail.100157110.JPG?ver=2004825', nameHanja: '김종천 (金鐘天)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100157110', gender: '남', birthAge: '1972.11.17 (53세)', occupation: '변호사', education: '서울대학교 조선해양공학과 졸업', career: '(전)민선7기 과천시장 (현)법무법인 태웅 구성원 변호사' },
  { district: '과천시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4123/Hb100154416/gicho/thumbnail.100154416.JPG?ver=1990915', nameHanja: '제갈임주 (諸葛林周)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154416', gender: '여', birthAge: '1972.11.07 (53세)', occupation: '정당인', education: '중앙대학교 간호학과 졸업', career: '(전)제8대 과천시의회 의장 (전)더불어민주당 중앙위원' },
  // 광명시 (3명)
  { district: '광명시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4114/Hb100155003/gicho/thumbnail.100155003.JPG?ver=1992682', nameHanja: '김영준 (金榮俊)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100155003', gender: '남', birthAge: '1967.04.13 (59세)', occupation: '정당인', education: '서울대학교 사회복지학과 졸업', career: '(전)제10대 경기도의회의원 (전)광명시자원봉사센터장' },
  { district: '광명시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4114/Hb100155674/gicho/thumbnail.100155674.JPG?ver=1997080', nameHanja: '양이원영 (梁李媛瑛)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100155674', gender: '여', birthAge: '1971.05.14 (55세)', occupation: '광명새물결포럼 대표', education: '한국개발연구원 국제정책대학원 졸업(정책학석사)', career: '(전)제21대 국회의원 (현)광명새물결포럼 대표' },
  { district: '광명시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4114/Hb100158225/gicho/thumbnail.100158225.JPEG?ver=2011822', nameHanja: '안성환 (安城煥)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100158225', gender: '남', birthAge: '1963.10.17 (62세)', occupation: '광명시의회의원', education: '연세대학교 졸업(경법대학 행정학 전공)', career: '(전)광명시의회 제9대 전반기 의장 (전)더불어민주당 정책위원회 부의장' },
  // 광주시 (7명)
  { district: '광주시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4140/Hb100156689/gicho/thumbnail.100156689.JPG?ver=2002789', nameHanja: '김상모 (金相模)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100156689', gender: '남', birthAge: '1977.11.09 (48세)', occupation: '정당인', education: '한국방송통신대학교 컴퓨터과학과 졸업', career: '(현)대한민국4차산업협회[K-FR] 대표 (전)더불어민주당제20대대통령선거후보선대위미래혁신위원회경기광주본부장' },
  { district: '광주시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4140/Hb100154272/gicho/thumbnail.100154272.JPG?ver=1991598', nameHanja: '김석구 (金奭具)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154272', gender: '남', birthAge: '1964.01.23 (62세)', occupation: '정당인', education: '경희대학교 법학전문대학원 법학과 박사과정 재학중', career: '(현)더불어민주당 당대표 특별보좌역 전략기획특보 (전)제9대 경기평택항만공사 사장' },
  { district: '광주시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4140/Hb100154095/gicho/thumbnail.100154095.JPG?ver=2002125', nameHanja: '노덕환 (盧德煥)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154095', gender: '남', birthAge: '1962.05.02 (64세)', occupation: '동국대학교 행정대학원 객원교수', education: '성균관대학교 국가전략대학원 국가전략학과 졸업(정치학석사)', career: '(현) 대통령 직속기관 민주평통 상임위원회 직능상임위원 (전) 광주시 정책자문관' },
  { district: '광주시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4140/Hb100153835/gicho/thumbnail.100153835.JPG?ver=1991697', nameHanja: '박관열 (朴灌烈)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100153835', gender: '남', birthAge: '1957.11.25 (68세)', occupation: '정당인', education: '고려대학교 정책대학원 아태지역연구학과 졸업(정치학석사)', career: '(전)제10대 경기도의회의원 (현)대통령직속 지방시대위원회 자문위원' },
  { district: '광주시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4140/Hb100154066/gicho/thumbnail.100154066.JPG?ver=1990828', nameHanja: '박남수 (朴南洙)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154066', gender: '남', birthAge: '1962.03.09 (64세)', occupation: '정당인', education: '한경대학교(현 한경국립대학교) 행정학과 졸업', career: '(전)광주도시관리공사 사장 (전)광주시청도시주택 국장' },
  { district: '광주시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4140/Hb100155715/gicho/thumbnail.100155715.JPG?ver=1997172', nameHanja: '소승호 (蘇承浩)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100155715', gender: '남', birthAge: '1958.03.13 (68세)', occupation: '정당인', education: '경희대학교 경영학(경영학사)', career: '(전)민선1,2기 광주시체육회장 (현)더불어민주당 경기도당 광주경제산업정책 특별위원회 위원장' },
  { district: '광주시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4140/Hb100154795/gicho/thumbnail.100154795.JPG?ver=1994547', nameHanja: '임일혁 (任日赫)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154795', gender: '남', birthAge: '1966.10.23 (59세)', occupation: '자영업(매양건재철물 대표)', education: '동원대학교 사회복지학과 졸업', career: '(전)제8대 광주시의회 후반기의장 (전)강동대학교 글로컬사회복지학부 특임교원(조교수)' },
  // 구리시 (3명)
  { district: '구리시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4125/Hb100155841/gicho/thumbnail.100155841.JPG?ver=1998222', nameHanja: '권봉수 (權奉洙)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100155841', gender: '남', birthAge: '1963.08.10 (62세)', occupation: '구리시의회의원', education: '건국대학교 일반대학원 경제학과 졸업(경제학 석사)', career: '(전)제9대 구리시의회 전반기 의장 (현)더불어민주당 전략기획위원회 부위원장' },
  { district: '구리시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4125/Hb100154423/gicho/thumbnail.100154423.JPG?ver=1991804', nameHanja: '신동화 (申東和)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154423', gender: '남', birthAge: '1966.12.28 (59세)', occupation: '구리시의회 의장', education: '서울시립대학교 도시과학대학원 도시행정학과 졸업 (도시행정학 석사)', career: '(전)더불어민주당 중앙위원 (현)구리시의회의장' },
  { district: '구리시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4125/Hb100154473/gicho/thumbnail.100154473.JPG?ver=1991805', nameHanja: '안승남 (安昇男)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154473', gender: '남', birthAge: '1965.12.29 (60세)', occupation: '회사원', education: '한국외국어대학교 경상대학 경제학과 졸업(경제학사)', career: '(전)제16대 구리시장 (현)더불어민주당 구리시지역위원회 상임고문' },
  // 군포시 (3명)
  { district: '군포시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4130/Hb100154612/gicho/thumbnail.100154612.JPG?ver=1991328', nameHanja: '이견행 (李見行)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154612', gender: '남', birthAge: '1965.12.29 (60세)', occupation: '정당인', education: '고려대학교 국어국문학과 졸업', career: '(전) 군포시의회 8대 전반기 의장 (전) 이학영 국회부의장 비서실장' },
  { district: '군포시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4130/Hb100155230/gicho/thumbnail.100155230.JPG?ver=2001023', nameHanja: '이길호 (李吉鎬)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100155230', gender: '남', birthAge: '1964.02.15 (62세)', occupation: '정당인', education: '한양대학교 철학과 졸업', career: '(전)군포초등학교 총동문회 회장 (현)군포시의회의원' },
  { district: '군포시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4130/Hb100154482/gicho/thumbnail.100154482.JPG?ver=1991080', nameHanja: '한대희 (韓大熙)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154482', gender: '남', birthAge: '1962.04.15 (64세)', occupation: '정당인', education: '한국외국어대학교 독일어과 3년 중퇴(1981.3.~1991.4.)', career: '(전) 군포시장 (현) 사람사는세상 노무현재단 기획위원' },
  // 김포시 (8명)
  { district: '김포시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4139/Hb100155347/gicho/thumbnail.100155347.JPG?ver=1993936', nameHanja: '김주관 (金柱寬)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100155347', gender: '남', birthAge: '1971.10.18 (54세)', occupation: '변호사', education: '한양대학교 법과대학 법학과 졸업', career: '(전)김포시고문변호사 (현)민주화를 위한 변호사모임(민변) 김포지회장' },
  { district: '김포시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4139/Hb100154885/gicho/thumbnail.100154885.JPG?ver=1992125', nameHanja: '배강민 (裵江珉)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154885', gender: '남', birthAge: '1977.02.28 (49세)', occupation: '김포시의회의원', education: '연세대학교 행정대학원 정치행정리더십전공 석사과정 졸업(행정학 석사)', career: '(전)더불어민주당 중앙당 정책위원회 부의장 (현)제8대김포시의회 부의장' },
  { district: '김포시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4139/Hb100155549/gicho/thumbnail.100155549.JPG?ver=1996448', nameHanja: '오강현 (吳姜縣)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100155549', gender: '남', birthAge: '1973.03.30 (53세)', occupation: '김포시의회의원', education: '연세대학교교육대학원 교육행정전공 석사과정졸업(교육학석사)', career: '(현)김포시의회의원 (현)더불어민주당 정책위원회 부의장' },
  { district: '김포시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4139/Hb100156825/gicho/thumbnail.100156825.JPG?ver=2003375', nameHanja: '이기형 (李奇衡)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100156825', gender: '남', birthAge: '1971.09.30 (54세)', occupation: '정당인', education: '중앙대학교 행정대학원 졸업(행정학석사)', career: '(전)제10대,11대 경기도의원 (현)더불어민주당 당대표 특별보좌역' },
  { district: '김포시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4139/Hb100157121/gicho/thumbnail.100157121.JPG?ver=2004883', nameHanja: '이회수 (李晦壽)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100157121', gender: '남', birthAge: '1962.06.07 (63세)', occupation: '정당인', education: '고려대학교 노동대학원 석사과정 졸업(법학석사)', career: '(전)이재명 대통령후보 대외협력특보단장 (전)이재명 당대표 소통정책특보' },
  { district: '김포시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4139/Hb100157677/gicho/thumbnail.100157677.JPG?ver=2008443', nameHanja: '정왕룡 (鄭王龍)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100157677', gender: '남', birthAge: '1964.03.18 (62세)', occupation: '정당인', education: '중앙대학교 문과대학 영어영문학과 졸업', career: '(전)대통령직속 국가균형발전위원회 전문위원 (현)더불어민주당 정책위 부의장' },
  { district: '김포시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4139/Hb100155168/gicho/thumbnail.100155168.JPG?ver=1993132', nameHanja: '정하영 (鄭夏泳)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100155168', gender: '남', birthAge: '1962.10.02 (63세)', occupation: '농업', education: '인하대학교 이과대학 생물학과 졸업', career: '(전)민선7기 김포시장 (전)더불어민주당 김포시을 지역위원장' },
  { district: '김포시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4139/Hb100157673/gicho/thumbnail.100157673.JPG?ver=2008331', nameHanja: '조승현 (趙承鉉)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100157673', gender: '남', birthAge: '1967.04.02 (59세)', occupation: '정당인', education: '연세대학교 행정대학원 북한·동아시아전공 석사과정 졸업(정치학 석사)', career: '(전)이재명 더불어민주당 대통령후보 부대변인 (현)더불어민주당 당대표 특별보좌역 지방자치특보' },
  // 남양주시 (6명)
  { district: '남양주시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4126/Hb100155587/gicho/thumbnail.100155587.JPG?ver=1997131', nameHanja: '김지훈 (金志訓)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100155587', gender: '남', birthAge: '1979.05.06 (47세)', occupation: '남양주시의회의원', education: '한양사이버대학교 졸업(법학전공)', career: '(전) 김용민 국회의원 환경특별보좌관 (현) 남양주시의회의원' },
  { district: '남양주시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4126/Hb100154408/gicho/thumbnail.100154408.JPG?ver=1990893', nameHanja: '김한정 (金漢正)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154408', gender: '남', birthAge: '1963.09.06 (62세)', occupation: '한미의회교류센터(KIPEC) 이사장', education: '서울대학교 사회과학대학 국제경제학과 졸업', career: '(전)국회의원(제20·21대 남양주을, 더불어민주당) (전)청와대 제1부속실장(김대중대통령)' },
  { district: '남양주시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4126/Hb100155484/gicho/thumbnail.100155484.JPG?ver=1995924', nameHanja: '백주선 (白周善)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100155484', gender: '남', birthAge: '1973.02.11 (53세)', occupation: '변호사', education: '중앙대학교 법학과 졸업', career: '(현)청와대 정보공개심의위원회 심의위원 (현)더불어민주당 당대표 법률특보' },
  { district: '남양주시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4126/Hb100155933/gicho/thumbnail.100155933.JPEG?ver=1998688', nameHanja: '윤용수 (尹湧洙)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100155933', gender: '남', birthAge: '1964.06.08 (61세)', occupation: '공인노무사', education: '단국대학교 법학과 졸업', career: '(전) 제10대 경기도의회의원 (현) 더불어민주당 당대표 특보' },
  { district: '남양주시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4126/Hb100154657/gicho/thumbnail.100154657.JPG?ver=1991427', nameHanja: '이원호 (李源鎬)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154657', gender: '남', birthAge: '1970.02.16 (56세)', occupation: '변호사', education: '동국대학교 사회학과 졸업', career: '(현) 대통령직속 지방시대위원회 자문위원 (현) 더불어민주당 당대표 특별보좌역 법률특보' },
  { district: '남양주시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4126/Hb100154668/gicho/thumbnail.100154668.JPG?ver=1991490', nameHanja: '최현덕 (崔顯德)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154668', gender: '남', birthAge: '1966.04.08 (60세)', occupation: '정당인', education: '고려대학교 행정학과 졸업', career: '(전) 남양주시 부시장 (전) 경기도 경제실장' },
  // 동두천시 (3명)
  { district: '동두천시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4117/Hb100155084/gicho/thumbnail.100155084.JPG?ver=1992977', nameHanja: '박태희 (朴泰熙)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100155084', gender: '남', birthAge: '1974.12.21 (51세)', occupation: '정치인', education: '고려대학교 정책대학원 행정학 석사', career: '(전)제10대 경기도의원 (전)정성호 국회의원 선임비서관' },
  { district: '동두천시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4117/Hb100157198/gicho/thumbnail.100157198.JPG?ver=2005452', nameHanja: '이인규 (李仁揆)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100157198', gender: '남', birthAge: '1963.06.03 (63세)', occupation: '정치인', education: '건국대학교 지리학과 졸업', career: '(전) 경기도의회의원 (전) 신흥고등학교 교장' },
  { district: '동두천시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4117/Hb100156768/gicho/thumbnail.100156768.JPG?ver=2003187', nameHanja: '정계숙 (鄭桂淑)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100156768', gender: '여', birthAge: '1961.11.28 (64세)', occupation: '정당인', education: '신한대학교 일반대학원 졸업(사회복지학 박사)', career: '(현) 서정대학교 겸임교수 (전) 동두천시의회의원 (7, 8대)' },
  // 부천시 (2명)
  { district: '부천시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4150/Hb100155157/gicho/thumbnail.100155157.JPG?ver=1993220', nameHanja: '서진웅 (徐珍雄)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100155157', gender: '남', birthAge: '1965.09.18 (60세)', occupation: '정당인', education: '연세대학교 행정대학원 졸업(행정학 석사)', career: '(전)대통령직속 국가균형발전위원회 전문위원 (전)국무총리 정무협력 비서관' },
  { district: '부천시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4150/Hb100154465/gicho/thumbnail.100154465.JPG?ver=1991207', nameHanja: '한병환 (韓秉煥)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154465', gender: '남', birthAge: '1965.03.22 (61세)', occupation: '정당인', education: '연세대학교 행정대학원 졸업(정책학석사)', career: '(전)청와대 정책실장 선임행정관 (전)제20대 대선 후보 이재명 선대위 국민참여플랫폼 부본부장' },
  // 성남시 (2명)
  { district: '성남시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4106/Hb100154437/gicho/thumbnail.100154437.JPG?ver=1991517', nameHanja: '김병욱 (金炳旭)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154437', gender: '남', birthAge: '1965.04.15 (61세)', occupation: '정당인', education: '고려대학교 경영대학원 졸업(경영학석사)', career: '(전)이재명대통령 청와대 정무비서관 (전)제20대,제21대 국회의원' },
  { district: '성남시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4106/Hb100154724/gicho/thumbnail.100154724.JPG?ver=1991750', nameHanja: '김지호 (金志澔)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154724', gender: '남', birthAge: '1976.02.26 (50세)', occupation: '정당인', education: '단국대학교 경영학과 졸업', career: '(전)이재명 민주당 당대표 정무조정부실장 (전)이재명 경기도지사 비서관' },
  // 수원시 (2명)
  { district: '수원시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4103/Hb100154785/gicho/thumbnail.100154785.JPG?ver=1991830', nameHanja: '권혁우 (權赫佑)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154785', gender: '남', birthAge: '1973.08.07 (52세)', occupation: '(주)코뉴 임원', education: '성균관대학교 생물기전공학과 졸업', career: '(전)제21대 대선 더불어민주당 이재명 후보 경기도당 선대위 공보본부 대변인 (현)더불어민주당 전략기획위원회 부위원장' },
  { district: '수원시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4103/Hb100154697/gicho/thumbnail.100154697.JPG?ver=1992841', nameHanja: '김재기 (金在基)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154697', gender: '남', birthAge: '1961.07.12 (64세)', occupation: '국민주권전국회의 경기본부 상임대표', education: '서울사이버대학교 사회복지대학 노인복지전공 졸업', career: '(현)국민주권전국회의 경기본부 상임대표 (전)수원경실련 공동대표' },
  // 시흥시 (1명)
  { district: '시흥시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4129/Hb100157971/gicho/thumbnail.100157971.JPG?ver=2010442', nameHanja: '이동현 (李東炫)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100157971', gender: '남', birthAge: '1977.08.04 (48세)', occupation: '정당인', education: '연세대학교 대학원 행정학과 석사과정수료', career: '(전)제21대 이재명 대통령 후보총괄특보단 경기도특보단 시흥시 본부장 (전)조정식 국회의원 정책비서관' },
  // 안산시 (8명)
  { district: '안산시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4119/Hb100156358/gicho/thumbnail.100156358.JPG?ver=2000912', nameHanja: '김철민 (金哲玟)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100156358', gender: '남', birthAge: '1957.02.15 (69세)', occupation: '신안산대학교 석좌교수', education: '한양대학교 산업경영디자인대학원(현 융합산업대학원) 졸업 (경영학석사)', career: '(전)민선5기 안산시장 (전)제20대, 제21대 국회의원' },
  { district: '안산시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4119/Hb100156546/gicho/thumbnail.100156546.JPG?ver=2002013', nameHanja: '김철진 (金哲鎭)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100156546', gender: '남', birthAge: '1963.08.15 (62세)', occupation: '정당인', education: '순천향대학교 행정대학원 사회복지학과 졸업(사회복지학석사)', career: '(전)제11대 경기도의회의원 (현)더불어민주당 중앙당 정책위원회 부의장' },
  { district: '안산시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4119/Hb100154454/gicho/thumbnail.100154454.JPG?ver=1991216', nameHanja: '박천광 (朴天光)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154454', gender: '남', birthAge: '1984.06.05 (41세)', occupation: '(주)아이리스코퍼레이션 총괄이사', education: '한양대학교 융합산업대학원 경영학과 졸업(경영학 석사)', career: '(전)제21대 대통령선거 이재명후보 조직본부 조직특보단 단장' },
  { district: '안산시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4119/Hb100156090/gicho/thumbnail.100156090.JPG?ver=1999685', nameHanja: '박현탁 (朴賢鐸)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100156090', gender: '남', birthAge: '1963.03.07 (63세)', occupation: '자영업', education: '고려대학교 정경대학 경제학과 졸업 (경제학사)', career: '(전)더불어민주당 안산단원을 지역위원장 직무대행 (전)제21대 대통령선거이재명후보 후보총괄특보단후보직속소상공인특보단중소기업특보' },
  { district: '안산시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4119/Hb100157285/gicho/thumbnail.100157285.JPG?ver=2006012', nameHanja: '송바우나 (宋바우나)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100157285', gender: '남', birthAge: '1983.02.23 (43세)', occupation: '안산시의회의원', education: '고려대학교 정경대학 정치외교학과 졸업', career: '(전)제9대 전반기 안산시의회의장 (현)제9대 안산시의회의원' },
  { district: '안산시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4119/Hb100155001/gicho/thumbnail.100155001.JPG?ver=2000041', nameHanja: '제종길 (諸淙吉)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100155001', gender: '남', birthAge: '1955.03.21 (71세)', occupation: '서울과학종합대학원대학교 석좌교수', education: '서울대학교 대학원 해양학과 졸업 (이학박사)', career: '(전)민선 6기 안산시장 (전)제17대 국회의원' },
  { district: '안산시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4119/Hb100154386/gicho/thumbnail.100154386.JPG?ver=1990849', nameHanja: '천영미 (千映美)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154386', gender: '여', birthAge: '1966.04.15 (60세)', occupation: '정당인', education: '강남대학교 사회복지전문대학원 사회복지학과 졸업(사회복지학석사)', career: '(전)더불어민주당 제21대 대통령선거 이재명 후보직속 정무특보 (현)더불어민주당 중앙당 중앙위원' },
  { district: '안산시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4119/Hb100158299/gicho/thumbnail.100158299.JPG?ver=2012331', nameHanja: '홍희관 (洪熙官)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100158299', gender: '남', birthAge: '1967.09.01 (58세)', occupation: '무직', education: '한국과학기술원(KAIST) 원자력공학과 졸업 (공학 석사)', career: '(전)안산환경재단 대표이사 (전)안산도시공사 교통환경본부장' },
  // 안성시 (2명)
  { district: '안성시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4138/Hb100156147/gicho/thumbnail.100156147.JPG?ver=2000185', nameHanja: '신원주 (辛源住)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100156147', gender: '남', birthAge: '1958.02.03 (68세)', occupation: '한국장애인문화협회 안성지부장', education: '한경대학교 융합레포츠학과 졸업', career: '(전) 제6대 안성시의회 부의장 (전) 제7대 안성시의회 의장' },
  { district: '안성시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4138/Hb100154970/gicho/thumbnail.100154970.JPG?ver=1994294', nameHanja: '황진택 (黃辰澤)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154970', gender: '남', birthAge: '1965.11.19 (60세)', occupation: '정당인', education: '동국대학교 행정대학원 공안행정학과 석사과정 수료', career: '(전) 제6대, 7대 안성시의회 의원 (현) 더불어민주당 안성지역위원회 부위원장' },
  // 안양시 (1명)
  { district: '안양시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4110/Hb100158302/gicho/thumbnail.100158302.JPG?ver=2012336', nameHanja: '임채호 (林彩鎬)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100158302', gender: '남', birthAge: '1960.05.24 (66세)', occupation: '정당인', education: '중앙대학교 행정대학원 정책학과 졸업(행정학석사)', career: '(전)경기도 정무수석 (전)경기도의회 부의장' },
  // 양주시 (1명)
  { district: '양주시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4116/Hb100154479/gicho/thumbnail.100154479.JPG?ver=1991090', nameHanja: '정덕영 (鄭德泳)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154479', gender: '남', birthAge: '1969.10.22 (56세)', occupation: '정당인', education: '고려대학교 정책대학원 도시및지방행정학과 석사과정 수료', career: '(현)정성호 국회의원 정책특보 (전)양주시의회 의장' },
  // 여주시 (3명)
  { district: '여주시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4133/Hb100156492/gicho/thumbnail.100156492.JPEG?ver=2001485', nameHanja: '박시선 (朴是宣)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100156492', gender: '남', birthAge: '1976.05.02 (50세)', occupation: '여주시의회의원', education: '동국대학교 대학원 수료(조경학 석사 과정)', career: '(전)여주시의회 의장 (현)여주시의회 부의장' },
  { district: '여주시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4133/Hb100155419/gicho/thumbnail.100155419.JPG?ver=1995436', nameHanja: '이대직 (李旲稙)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100155419', gender: '남', birthAge: '1961.09.10 (64세)', occupation: '정당인', education: '경희대학교 테크노경영대학원 졸업(경영학석사)', career: '(전)여주시부시장 (전)경기도농정해양국장' },
  { district: '여주시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4133/Hb100154085/gicho/thumbnail.100154085.JPEG?ver=1990598', nameHanja: '이항진 (李沆鎭)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154085', gender: '남', birthAge: '1965.10.25 (60세)', occupation: '정당인', education: '청주대학교 대학원 수료 (외식경영학 박사과정)', career: '(전)여주시장 (전)여주시의원' },
  // 오산시 (3명)
  { district: '오산시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4127/Hb100154398/gicho/thumbnail.100154398.JPG?ver=1990886', nameHanja: '김민주 (金民柱)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154398', gender: '남', birthAge: '1970.12.23 (55세)', occupation: '정당인', education: '청주대학교 경제학과 졸업', career: '(현)더불어민주당 중앙당 선임부대변인 (현)대통령 직속 지방시대위원회 자문위원' },
  { district: '오산시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4127/Hb100155365/gicho/thumbnail.100155365.JPG?ver=1994054', nameHanja: '송영만 (宋永萬)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100155365', gender: '남', birthAge: '1957.09.14 (68세)', occupation: '정당인', education: '한경대학교 국제개발협력대학원 졸업(경영학석사)', career: '(현)더불어민주당 오산시지역위원회 수석부위원장 (전)제8대 ~ 10대 경기도의회의원' },
  { district: '오산시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4127/Hb100156074/gicho/thumbnail.100156074.JPG?ver=1999324', nameHanja: '조재훈 (曺在薰)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100156074', gender: '남', birthAge: '1968.05.05 (58세)', occupation: '정당인', education: '연세대학교 공학대학원 졸업(공학석사)', career: '(전) 더불어민주당 제9, 10대 경기도의회 의원 (전) 더불어민주당 경기도당 부대변인' },
  // 용인시 (3명)
  { district: '용인시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4135/Hb100157860/gicho/thumbnail.100157860.JPG?ver=2009719', nameHanja: '정원영 (鄭元詠)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100157860', gender: '남', birthAge: '1967.08.28 (58세)', occupation: '경희대학교 객원연구원', education: '한국학중앙연구원 한국학대학원 졸업(정치학박사)', career: '(전)용인시정연구원 원장 (전)이재명 대선 후보직속 기본사회위원회 부위원장' },
  { district: '용인시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4135/Hb100157326/gicho/thumbnail.100157326.JPG?ver=2006448', nameHanja: '정춘숙 (鄭春淑)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100157326', gender: '여', birthAge: '1964.01.08 (62세)', occupation: '정당인', education: '강남대학교 사회복지전문대학원 졸업(사회복지학 박사)', career: '(전)제21대 국회 보건복지위원장 (전)제20, 21대 국회의원' },
  { district: '용인시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4135/Hb100156754/gicho/thumbnail.100156754.JPG?ver=2003126', nameHanja: '현근택 (玄根宅)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100156754', gender: '남', birthAge: '1971.06.11 (54세)', occupation: '변호사', education: '서울대학교 행정대학원 수료(정책학 석사과정)', career: '(전)민주연구원 부원장 (전)이재명 대선후보 대변인' },
  // 의왕시 (2명)
  { district: '의왕시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4124/Hb100158189/gicho/thumbnail.100158189.JPG?ver=2011604', nameHanja: '오동현 (吳東炫)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100158189', gender: '남', birthAge: '1978.02.13 (48세)', occupation: '법무법인(유한) 린 변호사', education: '한국과학기술원(KAIST) 지식재산대학원프로그램 졸업 (경영학 석사)', career: '(현) 법무법인(유한) 린 변호사 (전) 행정안전부 장관정책보좌관' },
  { district: '의왕시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4124/Hb100154487/gicho/thumbnail.100154487.JPEG?ver=1991108', nameHanja: '정순욱 (鄭淳旭)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154487', gender: '남', birthAge: '1966.06.26 (59세)', occupation: '정당인', education: '아주대학교 공공정책대학원 행정학과 졸업 (사회복지학석사)', career: '(전) 경기도지사 비서실장 (전) 광명시 · 동두천시 부시장' },
  // 의정부시 (5명)
  { district: '의정부시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4108/Hb100156125/gicho/thumbnail.100156125.JPG?ver=1999843', nameHanja: '김원기 (金元基)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100156125', gender: '남', birthAge: '1964.01.27 (62세)', occupation: '예원예술대학교 지역문화융합연구소장', education: '건양대학교 일반대학원 졸업(행정학박사)', career: '(전)더불어민주당 의정부시장 후보(2022년)' },
  { district: '의정부시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4108/Hb100155305/gicho/thumbnail.100155305.JPG?ver=1993782', nameHanja: '심화섭 (沈和燮)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100155305', gender: '남', birthAge: '1965.01.16 (61세)', occupation: '신한대학교 전자공학과 교수', education: '서강대학교 대학원 전자공학과(공학박사)', career: '(현)더불어민주당 당대표 특보 (현)신한대학교 공과대학 학장' },
  { district: '의정부시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4108/Hb100154560/gicho/thumbnail.100154560.JPG?ver=1991521', nameHanja: '안병용 (安炳龍)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154560', gender: '남', birthAge: '1956.04.22 (70세)', occupation: '무직', education: '동국대학교 대학원 행정학과 졸업(행정학박사)', career: '(전)더불어민주당 의정부시장(민선 7기) (전)신한대학교 행정학과 교수' },
  { district: '의정부시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4108/Hb100157449/gicho/thumbnail.100157449.JPEG?ver=2007141', nameHanja: '오석규 (吳碩奎)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100157449', gender: '남', birthAge: '1975.11.12 (50세)', occupation: '(주)더페이스메이커 대표이사', education: '경기대학교 관광전문대학원 졸업 (관광학박사)', career: '(전)경기도의회 의원(제11대) (현)더불어민주당 참좋은지방정부 상임위원' },
  { district: '의정부시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4108/Hb100154858/gicho/thumbnail.100154858.JPG?ver=1992130', nameHanja: '정진호 (鄭眞浩)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154858', gender: '남', birthAge: '1995.06.19 (30세)', occupation: '의정부시의회의원', education: '고려대학교 대학원졸업(행정학석사)', career: '(현)의정부시의회의원 (전)이재명 (제20대) 대통령 선대위 부대변인' },
  // 이천시 (3명)
  { district: '이천시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4134/Hb100157390/gicho/thumbnail.100157390.JPEG?ver=2007251', nameHanja: '서학원 (徐學源)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100157390', gender: '남', birthAge: '1974.06.10 (51세)', occupation: '이천시의회의원', education: '한양대학교 국제관광대학원 졸업(국제관광학 석사)', career: '(현)이천시의회 산업건설위원장 (전)더불어민주당 중앙당정책위원회 부의장' },
  { district: '이천시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4134/Hb100154893/gicho/thumbnail.100154893.JPG?ver=1992147', nameHanja: '성수석 (成洙釋)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154893', gender: '남', birthAge: '1970.10.05 (55세)', occupation: '정당인', education: '고려사이버대학교 경영학과 졸업', career: '(전)더불어민주당 이천시지역위원회 위원장 (현)더불어민주당 당대표특별보좌관' },
  { district: '이천시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4134/Hb100154392/gicho/thumbnail.100154392.JPG?ver=1990863', nameHanja: '엄태준 (嚴泰俊)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154392', gender: '남', birthAge: '1963.09.01 (62세)', occupation: '변호사', education: '단국대학교 법학과 졸업', career: '(전)제7대 이천시장 (전)더불어민주당 이천시지역위원장' },
  // 파주시 (2명)
  { district: '파주시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4132/Hb100154507/gicho/thumbnail.100154507.JPG?ver=1991140', nameHanja: '손배찬 (孫培讚)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154507', gender: '남', birthAge: '1962.11.17 (63세)', occupation: '더불어민주당 파주갑 교육연수위원장', education: '동국대학교 행정대학원 졸업(행정학석사)', career: '(전)파주시의회 의장 (전)파주시청소년재단 대표이사' },
  { district: '파주시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4132/Hb100154539/gicho/thumbnail.100154539.JPG?ver=1991365', nameHanja: '이용욱 (李鎔旭)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154539', gender: '남', birthAge: '1972.03.19 (54세)', occupation: '이용욱세무회계사무소 대표 세무사', education: '연세대학교 행정대학원 지방자치·도시행정전공 졸업(행정학석사)', career: '(전)경기도의회 경제노동위원회 의원 (현)이용욱세무회계사무소 대표' },
  // 평택시 (5명)
  { district: '평택시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4115/Hb100153872/gicho/thumbnail.100153872.JPG?ver=1990815', nameHanja: '공재광 (孔在光)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100153872', gender: '남', birthAge: '1963.03.20 (63세)', occupation: '정치인', education: '고려대학교 정책대학원 졸업(행정학석사, 도시및지방행정 전공)', career: '(전)평택시장 (전)대통령비서실 민정수석비서관 행정관' },
  { district: '평택시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4115/Hb100153840/gicho/thumbnail.100153840.JPG?ver=1991453', nameHanja: '김기성 (金基成)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100153840', gender: '남', birthAge: '1962.09.25 (63세)', occupation: '정당인', education: '경기대학교 행정·사회복지대학원 졸업(사회복지학석사)', career: '(전)평택시의회 부의장 (전)평택복지재단 이사장' },
  { district: '평택시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4115/Hb100153942/gicho/thumbnail.100153942.JPG?ver=1990814', nameHanja: '서현옥 (徐賢玉)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100153942', gender: '여', birthAge: '1968.03.03 (58세)', occupation: '정당인', education: '중앙대학교 대학원 의회학과 석사 졸업', career: '(현)더불어민주당 정책위원회 부의장 (전)제10·11대 경기도의회 의원' },
  { district: '평택시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4115/Hb100154906/gicho/thumbnail.100154906.JPG?ver=1992187', nameHanja: '유병만 (兪炳晩)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154906', gender: '남', birthAge: '1957.08.20 (68세)', occupation: '정당인', education: '연세대학교 행정대학원 졸업(행정학 석사)', career: '(전)이재명 대통령 후보 경기조직위원장 (전)문재인 대통령 후보 정책본부 자문위원' },
  { district: '평택시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4115/Hb100153870/gicho/thumbnail.100153870.JPG?ver=1990098', nameHanja: '최원용 (崔元鎔)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100153870', gender: '남', birthAge: '1967.03.15 (59세)', occupation: '정당인', education: '서울대학교 행정대학원 졸업(행정학석사)', career: '(현)더불어민주당 당대표 민생특보 (전)경기도청 기획조정실장' },
  // 포천시 (3명)
  { district: '포천시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4141/Hb100155968/gicho/thumbnail.100155968.JPG?ver=1998857', nameHanja: '강준모 (姜準模)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100155968', gender: '남', birthAge: '1965.11.22 (60세)', occupation: '그린자동차학원 공동대표', education: '단국대학교 토목공학과 졸업', career: '(전) 더불어민주당 정책위원회 부의장 (전) 포천시의회 부의장' },
  { district: '포천시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4141/Hb100157687/gicho/thumbnail.100157687.JPG?ver=2008565', nameHanja: '박윤국 (朴允國)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100157687', gender: '남', birthAge: '1956.04.12 (70세)', occupation: '정당인', education: '명지대학(현 명지대학교) 토목공학과 졸업', career: '(전) 포천시장 (전) 더불어민주당 포천가평 지역위원장' },
  { district: '포천시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4141/Hb100155868/gicho/thumbnail.100155868.JPG?ver=1998428', nameHanja: '연제창 (延濟昶)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100155868', gender: '남', birthAge: '1975.10.28 (50세)', occupation: '포천시의회 의원', education: '대진대학교 행정정보학과 졸업', career: '(현)포천시의회 부의장 (현)더불어민주당 정책위원회 부의장' },
  // 하남시 (3명)
  { district: '하남시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4131/Hb100155214/gicho/thumbnail.100155214.JPG?ver=1993708', nameHanja: '강병덕 (姜秉德)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100155214', gender: '남', birthAge: '1965.04.25 (61세)', occupation: '정당인', education: '한양대학교 행정·자치대학원 졸업(행정학석사)', career: '(전)21대 대선 이재명 대통령 후보 하남시 갑 상임선대위원장 (현)더불어민주당 당대표 정책특보' },
  { district: '하남시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4131/Hb100154762/gicho/thumbnail.100154762.JPG?ver=1993710', nameHanja: '서정완 (徐禎完)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154762', gender: '남', birthAge: '1971.04.11 (55세)', occupation: '정당인', education: '연세대학교 경제대학원 졸업(경제학 석사)', career: '(전)이재명 대통령 청와대 행정관 (전)21대 대선 이재명 대통령 후보 총괄정책본부 정책선임팀장' },
  { district: '하남시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4131/Hb100154754/gicho/thumbnail.100154754.JPG?ver=1993716', nameHanja: '오후석 (吳厚錫)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154754', gender: '남', birthAge: '1967.01.02 (59세)', occupation: '정당인', education: '연세대학교 대학원 정보산업도시공학(도시)과 졸업(공학박사)', career: '(전)경기도 행정2부지사 (현)더불어민주당 민주연구원 부원장' },
  // 화성시 (2명)
  { district: '화성시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4153/Hb100156244/gicho/thumbnail.100156244.JPG?ver=2000293', nameHanja: '김경희 (金京嬉)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100156244', gender: '여', birthAge: '1966.03.18 (60세)', occupation: '정치인', education: '명지대학교 대학원 아동학과 박사과정 수료', career: '(현)더불어민주당 당대표 여성특별보좌관 (전)화성시의회 의장' },
  { district: '화성시', photoUrl: 'https://info.nec.go.kr/photo_20260603/Gsg4153/Hb100154442/gicho/thumbnail.100154442.JPG?ver=1990963', nameHanja: '진석범 (晉錫範)', detailUrl: 'https://info.nec.go.kr/electioninfo/precandidate_detail_info.xhtml?electionId=0020260603&huboId=100154442', gender: '남', birthAge: '1972.07.05 (53세)', occupation: '무직', education: '건국대학교 일반대학원 졸업(사회복지학 박사)', career: '(전)이재명정부 청와대 선임행정관 (전)더불어민주당 화성시을 지역위원장' },
];

import { ENRICHMENT_MAP } from './candidateEnrichment';
import { getPledgeMapSync, loadPledgeMap } from './csvPledgeParser';

// huboId 추출
function extractHuboId(detailUrl: string): string {
  const match = detailUrl.match(/huboId=(\d+)/);
  return match ? match[1] : '';
}

// 원본 데이터 → Candidate 변환
function buildCandidates(): Record<string, Candidate[]> {
  const result: Record<string, Candidate[]> = {};
  const pledgeMap = getPledgeMapSync(); // CSV 공약 원문 (비동기 로드 후 캐시)

  for (const raw of RAW_CANDIDATES) {
    const regionId = DISTRICT_TO_REGION[raw.district];
    if (!regionId) continue;

    const huboId = extractHuboId(raw.detailUrl);
    const name = parseName(raw.nameHanja);
    const { birthday, age } = parseBirthAge(raw.birthAge);
    const careerItems = parseCareer(raw.career);
    const tags = generateTags(raw.occupation, raw.career);

    // CSV 보강 데이터 병합 (address)
    const enrichKey = `${raw.district}|${name}`;
    const enrich = ENRICHMENT_MAP[enrichKey];

    // CSV 공약 원문 (key_pledge, full_pledge)
    const pledge = pledgeMap[enrichKey];

    const candidate: Candidate = {
      id: huboId || `${regionId}-${name}`,
      regionId,
      regionName: raw.district,
      name,
      nameHanja: extractHanja(raw.nameHanja),
      imageUrl: raw.photoUrl,
      catchphrase: raw.occupation !== '정당인' && raw.occupation !== '무직' ? raw.occupation : '',
      tags,
      pledgeSummary: careerItems.join('\n'),
      personality: raw.occupation,
      birthday,
      age,
      career: careerItems,
      education: [raw.education],
      occupation: raw.occupation,
      gender: raw.gender,
      necDetailUrl: raw.detailUrl,
      pledges: [],
      keyPledge: pledge?.keyPledge || '',
      fullPledge: pledge?.fullPledge || '',
      address: raw.address || enrich?.address,
    };

    if (!result[regionId]) result[regionId] = [];
    result[regionId].push(candidate);
  }

  return result;
}

export const candidatesData: Record<string, Candidate[]> = buildCandidates();

// ── 순차 공개 영상 URL 매핑 ──
const VIDEO_MAP: Record<string, { interviewVideo?: string; debateVideo?: string; speechVideo?: string }> = {
  // 실제 영상 URL이 등록되면 아래 형식으로 추가:
  // '후보자huboId': { interviewVideo: 'https://...', debateVideo: 'https://...', speechVideo: 'https://...' },
};

// 다양한 더미 영상 (조회수 API 호출 테스트용 — 실제 유튜브 영상 ID)
const DUMMY_VIDEO_IDS = [
  'dQw4w9WgXcQ', // Rick Astley
  '9bZkp7q19f0', // Gangnam Style
  'kJQP7kiw5Fk', // Despacito
  'JGwWNGJdvx8', // Shape of You
  'RgKAFK5djSk', // See You Again
  'OPf0YbXqDm0', // Uptown Funk
  'CevxZvSJLk8', // Roar
  'pRpeEdMmmQ0', // Shake It Off
  'e-ORhEE9VVg', // Baby Shark
  'fJ9rUzIMcZQ', // Bohemian Rhapsody
  'hT_nvWreIhg', // Counting Stars
  '60ItHLz5WEA', // Alan Walker - Faded
  'YQHsXMglC9A', // Adele - Hello
  'lp-EO5I60KA', // Eminem - Lose Yourself
  'hLQl3WQQoQ0', // Someone Like You
  'PT2_F-1esPk', // Crazy Train
  '09R8_2nJtjg', // Sugar
  'kXYiU_JCYtU', // Numb
  'YR5ApYxkU-U', // Yesterday
  'djV11Xbc914', // Bad Guy
];

// 영상 URL 적용 — 후보자별로 다른 더미 영상 할당
function applyVideos() {
  let videoIdx = 0;
  for (const candidates of Object.values(candidatesData)) {
    for (const c of candidates) {
      const v = VIDEO_MAP[c.id];
      if (v) {
        if (v.interviewVideo) c.interviewVideo = v.interviewVideo;
        if (v.debateVideo) c.debateVideo = v.debateVideo;
        if (v.speechVideo) c.speechVideo = v.speechVideo;
      }
      if (!c.interviewVideo) {
        const vid = DUMMY_VIDEO_IDS[videoIdx % DUMMY_VIDEO_IDS.length];
        c.interviewVideo = `https://www.youtube.com/watch?v=${vid}`;
        videoIdx++;
      }
    }
  }
}
applyVideos();

// ── CSV 공약 비동기 로드 후 병합 ──
let _pledgesLoaded = false;
const _pledgeListeners: (() => void)[] = [];

export function isPledgesLoaded(): boolean {
  return _pledgesLoaded;
}

export function onPledgesLoaded(cb: () => void): () => void {
  if (_pledgesLoaded) { cb(); return () => {}; }
  _pledgeListeners.push(cb);
  return () => {
    const idx = _pledgeListeners.indexOf(cb);
    if (idx >= 0) _pledgeListeners.splice(idx, 1);
  };
}

// 앱 시작 시 CSV 로드 → 공약 병합
loadPledgeMap().then((pledgeMap) => {
  let mergedCount = 0;
  let missedCount = 0;
  const missedNames: string[] = [];

  for (const candidates of Object.values(candidatesData)) {
    for (const c of candidates) {
      const key = `${c.regionName}|${c.name}`;
      const p = pledgeMap[key];
      if (p) {
        c.keyPledge = p.keyPledge;
        c.fullPledge = p.fullPledge;
        mergedCount++;
      } else {
        missedCount++;
        if (missedNames.length < 5) missedNames.push(key);
      }
    }
  }

  console.log(`[Candidates] 공약 병합 완료: ${mergedCount}명 성공 | ${missedCount}명 미매핑`);
  if (missedNames.length > 0) {
    console.log(`[Candidates] 미매핑 샘플 (최대 5):`, missedNames);
  }

  _pledgesLoaded = true;
  _pledgeListeners.forEach((cb) => cb());
  _pledgeListeners.length = 0;
});

// 지역별 후보자 가져오기
export function getCandidatesByRegion(regionId: string): Candidate[] {
  return candidatesData[regionId] || [];
}

// 전체 후보자 가져오기
export function getAllCandidates(): Candidate[] {
  return Object.values(candidatesData).flat();
}
