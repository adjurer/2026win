import { useParams, Navigate } from 'react-router';

/**
 * CandidateList는 이제 /?region=regionId로 리다이렉트합니다.
 * 홈 페이지의 전체 레이아웃(배너+드롭다운+카드+선거안내)을 재사용하기 위함입니다.
 */
export default function CandidateList() {
  const { regionId } = useParams<{ regionId: string }>();
  return <Navigate to={`/?region=${regionId || ''}`} replace />;
}
