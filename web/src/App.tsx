import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';

import TodayPage from './pages/TodayPage';
import GoalsPage from './pages/GoalsPage';
import BacklogPage from './pages/BacklogPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import CapturesPage from './pages/CapturesPage';
import PartnerPage from './pages/PartnerPage';
import SettingsPage from './pages/SettingsPage';
import SharedPartnerPage from './pages/SharedPartnerPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Shared Route (outside AppLayout) */}
        <Route path="/shared/:token" element={<SharedPartnerPage />} />
        
        {/* Authenticated Routes */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/today" replace />} />
          <Route path="today" element={<TodayPage />} />
          <Route path="backlog" element={<BacklogPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="opportunities" element={<OpportunitiesPage />} />
          <Route path="captures" element={<CapturesPage />} />
          <Route path="partner" element={<PartnerPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
