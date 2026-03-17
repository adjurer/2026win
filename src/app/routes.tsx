import { createBrowserRouter } from 'react-router';
import Layout from './components/Layout';
import Home from './pages/Home';
import CandidateList from './pages/CandidateList';
import CandidateDetail from './pages/CandidateDetail';

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
    ],
  },
]);
