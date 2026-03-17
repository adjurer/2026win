# 후보자 데이터 스프레드시트 가이드

## 📊 스프레드시트 형식

Google Sheets나 Excel에서 다음 컬럼 구조로 작성해주세요:

| 컬럼명 | 필수 | 설명 | 예시 |
|--------|------|------|------|
| `regionId` | ✅ | 지역 ID (영문 소문자) | suwon, seongnam, goyang |
| `regionName` | ✅ | 지역명 (한글) | 수원시, 성남시, 고양시 |
| `candidateId` | ✅ | 후보자 고유 ID | suwon-001, seongnam-001 |
| `name` | ✅ | 후보자 이름 | 김민주, 이정민 |
| `imageUrl` | ⚠️ | 후보자 사진 URL | https://example.com/photo.jpg |
| `catchphrase` | ✅ | 캐치프레이즈 | 수원의 미래, 청년이 바꾸겠습니다 |
| `tags` | ✅ | 키워드 (쉼표 구분) | 청년정책,교통혁신,일자리창출 |
| `pledgeSummary` | ✅ | 공약요약 (줄바꿈: \\n) | • 수원 순환 BRT 노선 확대\\n• 청년 창업 지원 센터 3개소 신설 |
| `personality` | ✅ | 성격/리더십 예측 | 혁신적이고 추진력 있는 리더십. 청년과 시민의 목소리에 귀 기울이는 소통형 정치인. |
| `career` | ⬜ | 경력 (쉼표 구분) | 경기도의회 의원,수원시 정책위원장 |
| `pledges` | ⬜ | 세부 공약 (쉼표 구분) | 교통 인프라 확충,청년 일자리 창출 |
| `interviewVideo` | ⬜ | 공개면접 영상 URL | https://youtube.com/... |
| `debateVideo` | ⬜ | 합동토론회 영상 URL | https://youtube.com/... |
| `speechVideo` | ⬜ | 합동연설회 영상 URL | https://youtube.com/... |

## 📍 지역 ID 목록

| 지역명 | regionId |
|--------|----------|
| 수원시 | suwon |
| 성남시 | seongnam |
| 고양시 | goyang |
| 용인시 | yongin |
| 부천시 | bucheon |
| 안산시 | ansan |
| 남양주시 | namyangju |
| 안양시 | anyang |
| 평택시 | pyeongtaek |
| 시흥시 | siheung |
| 파주시 | paju |
| 의정부시 | uijeongbu |
| 김포시 | gimpo |
| 광주시 | gwangju |
| 광명시 | gwangmyeong |
| 군포시 | gunpo |
| 하남시 | hanam |
| 오산시 | osan |
| 양주시 | yangju |
| 이천시 | icheon |
| 구리시 | guri |
| 안성시 | anseong |
| 포천시 | pocheon |
| 의왕시 | uiwang |
| 여주시 | yeoju |
| 양평군 | yangpyeong |
| 동두천시 | dongducheon |
| 과천시 | gwacheon |
| 가평군 | gapyeong |
| 연천군 | yeoncheon |
| 화성시 | hwaseong |

## 🔄 데이터 전달 방법

### 방법 1: Google Sheets CSV Export (추천)

1. Google Sheets에서 데이터 작성
2. **파일 > 다운로드 > 쉼표로 구분된 값(.csv)**
3. CSV 파일을 온라인 호스팅 (예: Google Drive 공유 링크, Dropbox 등)
4. 공개 URL을 제공

### 방법 2: Google Sheets 직접 공유

1. Google Sheets에서 **파일 > 공유 > 웹에 게시**
2. **CSV** 형식 선택
3. 생성된 URL을 제공
   - 형식: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/export?format=csv`

### 방법 3: 채팅으로 테이블 직접 전달

다음 형식으로 채팅에 붙여넣기:

\`\`\`
regionId | regionName | candidateId | name | imageUrl | catchphrase | tags | pledgeSummary | personality
suwon | 수원시 | suwon-001 | 김민주 | [URL] | 수원의 미래... | 청년정책,교통혁신 | • 공약1\\n• 공약2 | 혁신적이고...
\`\`\`

## 🖼️ 이미지 처리

### 현재: 더미 이미지
- Unsplash에서 자동으로 인물 사진 사용
- 프로토타입 단계에 적합

### 추후: 실제 후보자 사진
다음 방법 중 선택:

1. **이미지 호스팅 서비스** (추천)
   - Imgur, Cloudinary, AWS S3 등에 업로드
   - 공개 URL을 스프레드시트에 입력

2. **Google Drive**
   - 이미지를 Google Drive에 업로드
   - 공유 설정: "링크가 있는 모든 사용자"
   - 직접 링크 생성: `https://drive.google.com/uc?id=[FILE_ID]`

3. **GitHub Repository**
   - 이미지를 GitHub에 업로드
   - Raw URL 사용: `https://raw.githubusercontent.com/[USER]/[REPO]/main/images/candidate.jpg`

## 📋 예시 데이터

\`\`\`csv
regionId,regionName,candidateId,name,imageUrl,catchphrase,tags,pledgeSummary,personality
suwon,수원시,suwon-001,김민주,https://example.com/kim.jpg,수원의 미래 청년이 바꾸겠습니다,청년정책,교통혁신,일자리창출,• 수원 순환 BRT 노선 확대\n• 청년 창업 지원 센터 3개소 신설\n• 공공 어린이집 50% 확충,혁신적이고 추진력 있는 리더십. 청년과 시민의 목소리에 귀 기울이는 소통형 정치인.
suwon,수원시,suwon-002,이정민,https://example.com/lee.jpg,시민과 함께하는 수원 르네상스,복지확대,문화도시,환경보호,• 팔달구 문화예술 특화거리 조성\n• 취약계층 복지 예산 20% 증액\n• 수원천 생태공원 복원 프로젝트,따뜻한 감성과 세심한 배려. 시민의 삶의 질 향상에 초점을 맞춘 행정가형 정치인.
\`\`\`

## 🎯 적용 방법

스프레드시트가 준비되면, 채팅에서:

1. **CSV URL 제공**: "이 URL의 CSV 데이터를 적용해주세요: [URL]"
2. **테이블 직접 붙여넣기**: 위 형식의 표를 복사하여 붙여넣기
3. **지역별 개별 전달**: 한 지역씩 후보자 정보 전달

---

## ✅ 체크리스트

데이터 전달 전 확인사항:

- [ ] 모든 필수 컬럼(✅)이 채워져 있는가?
- [ ] regionId가 정확한가? (위 목록 참조)
- [ ] tags는 쉼표로 구분되어 있는가?
- [ ] pledgeSummary에서 줄바꿈은 `\n`으로 표시했는가?
- [ ] 이미지 URL이 공개 접근 가능한가?
- [ ] candidateId가 고유한가? (중복 없음)

질문이 있으시면 언제든지 채팅으로 문의해주세요!
