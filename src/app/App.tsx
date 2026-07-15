import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './Layout';
import { ErrorBoundary } from './ErrorBoundary';
import { Dashboard } from '@/features/dashboard/Dashboard';

const router = createBrowserRouter([
  {
    path: '/', element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'learn/:conceptId?', lazy: () => import('@/features/learn/Learn').then((m) => ({ Component: m.Learn })) },
      { path: 'course', lazy: () => import('@/features/course/Course').then((m) => ({ Component: m.Course })) },
      { path: 'review', lazy: () => import('@/features/review/Review').then((m) => ({ Component: m.Review })) },
      { path: 'quiz', lazy: () => import('@/features/quiz/Quiz').then((m) => ({ Component: m.Quiz })) },
      { path: 'interview', lazy: () => import('@/features/interview/Interview').then((m) => ({ Component: m.Interview })) },
      { path: 'daily', lazy: () => import('@/features/daily/Daily').then((m) => ({ Component: m.Daily })) },
      { path: 'diagram/:scenarioId?', lazy: () => import('@/features/diagram/Diagram').then((m) => ({ Component: m.Diagram })) },
      { path: 'compare/:a?/:b?', lazy: () => import('@/features/compare/Compare').then((m) => ({ Component: m.Compare })) },
      { path: 'map', lazy: () => import('@/features/map/Map').then((m) => ({ Component: m.Map })) },
      { path: 'library', lazy: () => import('@/features/library/Library').then((m) => ({ Component: m.Library })) },
      { path: 'library/:conceptId', lazy: () => import('@/features/library/ConceptPage').then((m) => ({ Component: m.ConceptPage })) },
      { path: 'progress', lazy: () => import('@/features/progress/Progress').then((m) => ({ Component: m.Progress })) },
    ],
  },
], { basename: import.meta.env.BASE_URL });

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
