import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './Layout';
import { ErrorBoundary } from './ErrorBoundary';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { Learn } from '@/features/learn/Learn';
import { Review } from '@/features/review/Review';
import { Quiz } from '@/features/quiz/Quiz';
import { Library } from '@/features/library/Library';
import { ConceptPage } from '@/features/library/ConceptPage';
import { Progress } from '@/features/progress/Progress';

const router = createBrowserRouter([
  {
    path: '/', element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'learn/:conceptId?', element: <Learn /> },
      { path: 'review', element: <Review /> },
      { path: 'quiz', element: <Quiz /> },
      { path: 'library', element: <Library /> },
      { path: 'library/:conceptId', element: <ConceptPage /> },
      { path: 'progress', element: <Progress /> },
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
