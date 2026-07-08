import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';

import TodayPage from './pages/TodayPage';
import GoalsPage from './pages/GoalsPage';

// Placeholder Pages
const Page = ({ title }: { title: string }) => (
  <div className="p-4 md:p-6 lg:p-8 text-[var(--text-primary)]">
    <h1 className="text-xl md:text-2xl font-semibold mb-4">{title}</h1>
    <div className="border border-[var(--border-hairline)] rounded-lg p-4 bg-[var(--bg-surface)]">
      <p className="text-[var(--text-secondary)]">Empty state for {title}</p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/today" replace />} />
          <Route path="today" element={<TodayPage />} />
          <Route path="backlog" element={<Page title="Backlog" />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="opportunities" element={<Page title="Opportunities" />} />
          <Route path="captures" element={<Page title="Captures" />} />
          <Route path="partner" element={<Page title="Partner" />} />
          <Route path="settings" element={<Page title="Settings" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
