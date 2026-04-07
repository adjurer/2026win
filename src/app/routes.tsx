import { createBrowserRouter } from 'react-router';
import Layout from './components/Layout';
import Home from './pages/Home';
import CandidateList from './pages/CandidateList';
import CandidateDetail from './pages/CandidateDetail';

function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="text-center">
        <div className="text-[64px] mb-4" style={{ fontWeight: 800, color: '#002BFF' }}>404</div>
        <p className="text-[18px] text-gray-500 mb-6" style={{ fontWeight: 500 }}>페이지를 찾을 수 없습니다.</p>
        <a
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-white text-[14px] transition-all hover:opacity-90"
          style={{ background: '#002BFF', fontWeight: 700 }}
        >
          홈으로 돌아가기
        </a>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'candidates/:regionId',
        element: <CandidateList />,
      },
      {
        path: 'candidate/:candidateId',
        element: <CandidateDetail />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);