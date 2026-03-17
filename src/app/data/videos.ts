export interface Video {
  id: string;
  videoId: string;
  title: string;
  candidate: string;
  category: '공개면접' | '합동토론회' | '합동연설회';
}

export interface RegionVideos {
  [regionId: string]: {
    name: string;
    videos: Video[];
  };
}

// 각 지역별 후보자 영상 데이터 (예시 데이터)
export const regionVideos: RegionVideos = {
  goyang: {
    name: '고양시',
    videos: [
      {
        id: 'goyang-1',
        videoId: 'dQw4w9WgXcQ',
        title: '고양시 후보자 공개면접',
        candidate: '김철수',
        category: '공개면접',
      },
      {
        id: 'goyang-2',
        videoId: 'dQw4w9WgXcQ',
        title: '고양시 후보자 합동토론회',
        candidate: '이영희',
        category: '합동토론회',
      },
      {
        id: 'goyang-3',
        videoId: 'dQw4w9WgXcQ',
        title: '고양시 후보자 합동연설회',
        candidate: '박민수',
        category: '합동연설회',
      },
    ],
  },
  paju: {
    name: '파주시',
    videos: [
      {
        id: 'paju-1',
        videoId: 'dQw4w9WgXcQ',
        title: '파주시 후보자 공개면접',
        candidate: '최지영',
        category: '공개면접',
      },
      {
        id: 'paju-2',
        videoId: 'dQw4w9WgXcQ',
        title: '파주시 후보자 합동토론회',
        candidate: '정현우',
        category: '합동토론회',
      },
    ],
  },
  yangju: {
    name: '양주시',
    videos: [
      {
        id: 'yangju-1',
        videoId: 'dQw4w9WgXcQ',
        title: '양주시 후보자 공개면접',
        candidate: '강미래',
        category: '공개면접',
      },
      {
        id: 'yangju-2',
        videoId: 'dQw4w9WgXcQ',
        title: '양주시 후보자 합동연설회',
        candidate: '오준석',
        category: '합동연설회',
      },
    ],
  },
  dongducheon: {
    name: '동두천시',
    videos: [
      {
        id: 'dongducheon-1',
        videoId: 'dQw4w9WgXcQ',
        title: '동두천시 후보자 공개면접',
        candidate: '서예진',
        category: '공개면접',
      },
    ],
  },
  pocheon: {
    name: '포천시',
    videos: [
      {
        id: 'pocheon-1',
        videoId: 'dQw4w9WgXcQ',
        title: '포천시 후보자 합동토론회',
        candidate: '송태양',
        category: '합동토론회',
      },
      {
        id: 'pocheon-2',
        videoId: 'dQw4w9WgXcQ',
        title: '포천시 후보자 공개면접',
        candidate: '윤하늘',
        category: '공개면접',
      },
    ],
  },
  uijeongbu: {
    name: '의정부시',
    videos: [
      {
        id: 'uijeongbu-1',
        videoId: 'dQw4w9WgXcQ',
        title: '의정부시 후보자 공개면접',
        candidate: '한별',
        category: '공개면접',
      },
      {
        id: 'uijeongbu-2',
        videoId: 'dQw4w9WgXcQ',
        title: '의정부시 후보자 합동토론회',
        candidate: '조은비',
        category: '합동토론회',
      },
      {
        id: 'uijeongbu-3',
        videoId: 'dQw4w9WgXcQ',
        title: '의정부시 후보자 합동연설회',
        candidate: '임강호',
        category: '합동연설회',
      },
    ],
  },
  namyangju: {
    name: '남양주시',
    videos: [
      {
        id: 'namyangju-1',
        videoId: 'dQw4w9WgXcQ',
        title: '남양주시 후보자 공개면접',
        candidate: '전수아',
        category: '공개면접',
      },
      {
        id: 'namyangju-2',
        videoId: 'dQw4w9WgXcQ',
        title: '남양주시 후보자 합동연설회',
        candidate: '유진우',
        category: '합동연설회',
      },
    ],
  },
  gapyeong: {
    name: '가평군',
    videos: [
      {
        id: 'gapyeong-1',
        videoId: 'dQw4w9WgXcQ',
        title: '가평군 후보자 공개면접',
        candidate: '홍세진',
        category: '공개면접',
      },
    ],
  },
  bucheon: {
    name: '부천시',
    videos: [
      {
        id: 'bucheon-1',
        videoId: 'dQw4w9WgXcQ',
        title: '부천시 후보자 공개면접',
        candidate: '신동혁',
        category: '공개면접',
      },
      {
        id: 'bucheon-2',
        videoId: 'dQw4w9WgXcQ',
        title: '부천시 후보자 합동토론회',
        candidate: '권나영',
        category: '합동토론회',
      },
    ],
  },
  gwangmyeong: {
    name: '광명시',
    videos: [
      {
        id: 'gwangmyeong-1',
        videoId: 'dQw4w9WgXcQ',
        title: '광명시 후보자 합동토론회',
        candidate: '배준영',
        category: '합동토론회',
      },
    ],
  },
  siheung: {
    name: '시흥시',
    videos: [
      {
        id: 'siheung-1',
        videoId: 'dQw4w9WgXcQ',
        title: '시흥시 후보자 공개면접',
        candidate: '나윤서',
        category: '공개면접',
      },
      {
        id: 'siheung-2',
        videoId: 'dQw4w9WgXcQ',
        title: '시흥시 후보자 합동연설회',
        candidate: '문지호',
        category: '합동연설회',
      },
    ],
  },
  ansan: {
    name: '안산시',
    videos: [
      {
        id: 'ansan-1',
        videoId: 'dQw4w9WgXcQ',
        title: '안산시 후보자 공개면접',
        candidate: '양시우',
        category: '공개면접',
      },
      {
        id: 'ansan-2',
        videoId: 'dQw4w9WgXcQ',
        title: '안산시 후보자 합동토론회',
        candidate: '표민지',
        category: '합동토론회',
      },
    ],
  },
  anyang: {
    name: '안양시',
    videos: [
      {
        id: 'anyang-1',
        videoId: 'dQw4w9WgXcQ',
        title: '안양시 후보자 공개면접',
        candidate: '노서연',
        category: '공개면접',
      },
      {
        id: 'anyang-2',
        videoId: 'dQw4w9WgXcQ',
        title: '안양시 후보자 합동토론회',
        candidate: '도현준',
        category: '합동토론회',
      },
      {
        id: 'anyang-3',
        videoId: 'dQw4w9WgXcQ',
        title: '안양시 후보자 합동연설회',
        candidate: '추유진',
        category: '합동연설회',
      },
    ],
  },
  seongnam: {
    name: '성남시',
    videos: [
      {
        id: 'seongnam-1',
        videoId: 'dQw4w9WgXcQ',
        title: '성남시 후보자 공개면접',
        candidate: '고은별',
        category: '공개면접',
      },
      {
        id: 'seongnam-2',
        videoId: 'dQw4w9WgXcQ',
        title: '성남시 후보자 합동토론회',
        candidate: '소준혁',
        category: '합동토론회',
      },
    ],
  },
  hanam: {
    name: '하남시',
    videos: [
      {
        id: 'hanam-1',
        videoId: 'dQw4w9WgXcQ',
        title: '하남시 후보자 공개면접',
        candidate: '반하은',
        category: '공개면접',
      },
    ],
  },
  gwangju: {
    name: '광주시',
    videos: [
      {
        id: 'gwangju-1',
        videoId: 'dQw4w9WgXcQ',
        title: '광주시 후보자 합동토론회',
        candidate: '복민서',
        category: '합동토론회',
      },
    ],
  },
  yongin: {
    name: '용인시',
    videos: [
      {
        id: 'yongin-1',
        videoId: 'dQw4w9WgXcQ',
        title: '용인시 후보자 공개면접',
        candidate: '방지윤',
        category: '공개면접',
      },
      {
        id: 'yongin-2',
        videoId: 'dQw4w9WgXcQ',
        title: '용인시 후보자 합동토론회',
        candidate: '변도윤',
        category: '합동토론회',
      },
    ],
  },
  suwon: {
    name: '수원시',
    videos: [
      {
        id: 'suwon-1',
        videoId: 'dQw4w9WgXcQ',
        title: '수원시 후보자 공개접',
        candidate: '사서현',
        category: '공개면접',
      },
      {
        id: 'suwon-2',
        videoId: 'dQw4w9WgXcQ',
        title: '수원시 후보자 합동토론회',
        candidate: '석우진',
        category: '합동토론회',
      },
      {
        id: 'suwon-3',
        videoId: 'dQw4w9WgXcQ',
        title: '수원시 후보자 합동연설회',
        candidate: '선아인',
        category: '합동연설회',
      },
    ],
  },
  osan: {
    name: '오산시',
    videos: [
      {
        id: 'osan-1',
        videoId: 'dQw4w9WgXcQ',
        title: '오산시 후보자 공개면접',
        candidate: '설재민',
        category: '공개면접',
      },
    ],
  },
  hwaseong: {
    name: '화성시',
    videos: [
      {
        id: 'hwaseong-1',
        videoId: 'dQw4w9WgXcQ',
        title: '화성시 후보자 공개면접',
        candidate: '성예원',
        category: '공개면접',
      },
      {
        id: 'hwaseong-2',
        videoId: 'dQw4w9WgXcQ',
        title: '화성시 후보자 합동토론회',
        candidate: '손지환',
        category: '합동토론회',
      },
    ],
  },
  pyeongtaek: {
    name: '평택시',
    videos: [
      {
        id: 'pyeongtaek-1',
        videoId: 'dQw4w9WgXcQ',
        title: '평택시 후보자 공개면접',
        candidate: '송채원',
        category: '공개면접',
      },
      {
        id: 'pyeongtaek-2',
        videoId: 'dQw4w9WgXcQ',
        title: '평택시 후보자 합동연설회',
        candidate: '신시후',
        category: '합동연설회',
      },
    ],
  },
  anseong: {
    name: '안성시',
    videos: [
      {
        id: 'anseong-1',
        videoId: 'dQw4w9WgXcQ',
        title: '안성시 후보자 합동토론회',
        candidate: '심유나',
        category: '합동토론회',
      },
    ],
  },
  icheon: {
    name: '이천시',
    videos: [
      {
        id: 'icheon-1',
        videoId: 'dQw4w9WgXcQ',
        title: '이천시 후보자 공개면접',
        candidate: '안준서',
        category: '공개면접',
      },
      {
        id: 'icheon-2',
        videoId: 'dQw4w9WgXcQ',
        title: '이천시 후보자 합동연설회',
        candidate: '양서윤',
        category: '합동연설회',
      },
    ],
  },
  yeoju: {
    name: '여주시',
    videos: [
      {
        id: 'yeoju-1',
        videoId: 'dQw4w9WgXcQ',
        title: '여주시 후보자 공개면접',
        candidate: '어지우',
        category: '공개면접',
      },
    ],
  },
  yangpyeong: {
    name: '양평군',
    videos: [
      {
        id: 'yangpyeong-1',
        videoId: 'dQw4w9WgXcQ',
        title: '양평군 후보자 합동토론회',
        candidate: '엄수아',
        category: '합동토론회',
      },
    ],
  },
  yeoncheon: {
    name: '연천군',
    videos: [
      {
        id: 'yeoncheon-1',
        videoId: 'dQw4w9WgXcQ',
        title: '연천군 후보자 공개면접 - 여도현',
        candidate: '여도현',
        category: '공개면접',
      },
      {
        id: 'yeoncheon-2',
        videoId: 'dQw4w9WgXcQ',
        title: '연천군 후보자 공개면접 - 김민수',
        candidate: '김민수',
        category: '공개면접',
      },
      {
        id: 'yeoncheon-3',
        videoId: 'dQw4w9WgXcQ',
        title: '연천군 후보자 공개면접 - 박지영',
        candidate: '박지영',
        category: '공개면접',
      },
      {
        id: 'yeoncheon-4',
        videoId: 'dQw4w9WgXcQ',
        title: '연천군 후보자 공개면접 - 이승호',
        candidate: '이승호',
        category: '공개면접',
      },
      {
        id: 'yeoncheon-5',
        videoId: 'dQw4w9WgXcQ',
        title: '연천군 후보자 공개면접 - 최한결',
        candidate: '최한결',
        category: '공개면접',
      },
    ],
  },
  guri: {
    name: '구리시',
    videos: [
      {
        id: 'guri-1',
        videoId: 'dQw4w9WgXcQ',
        title: '구리시 후보자 공개면접',
        candidate: '연하윤',
        category: '공개면접',
      },
      {
        id: 'guri-2',
        videoId: 'dQw4w9WgXcQ',
        title: '구리시 후보자 합동토론회',
        candidate: '염건우',
        category: '합동토론회',
      },
    ],
  },
  gunpo: {
    name: '군포시',
    videos: [
      {
        id: 'gunpo-1',
        videoId: 'dQw4w9WgXcQ',
        title: '군포시 후보자 합동연설회',
        candidate: '오서진',
        category: '합동연설회',
      },
    ],
  },
  uiwang: {
    name: '의왕시',
    videos: [
      {
        id: 'uiwang-1',
        videoId: 'dQw4w9WgXcQ',
        title: '의왕시 후보자 공개면접',
        candidate: '옥현서',
        category: '공개면접',
      },
    ],
  },
  gwacheon: {
    name: '과천시',
    videos: [
      {
        id: 'gwacheon-1',
        videoId: 'dQw4w9WgXcQ',
        title: '과천시 후보자 합동토론회',
        candidate: '왕민준',
        category: '합동토론회',
      },
    ],
  },
  gimpo: {
    name: '김포시',
    videos: [
      {
        id: 'gimpo-1',
        videoId: 'dQw4w9WgXcQ',
        title: '김포시 후보자 공개면접',
        candidate: '장서윤',
        category: '공개면접',
      },
      {
        id: 'gimpo-2',
        videoId: 'dQw4w9WgXcQ',
        title: '김포시 후보자 합동토론회',
        candidate: '차민호',
        category: '합동토론회',
      },
    ],
  },
};