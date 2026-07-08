import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import AppLayout from './layouts/AppLayout';
import TodayPage from './pages/TodayPage';
import GoalsPage from './pages/GoalsPage';
import BacklogPage from './pages/BacklogPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import CapturesPage from './pages/CapturesPage';
import VaultPage from './pages/VaultPage';
import PartnerPage from './pages/PartnerPage';
import SettingsPage from './pages/SettingsPage';
import SharedPartnerPage from './pages/SharedPartnerPage';

import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  
  if (loading) return <div className="p-6">Loading...</div>;
  if (!session) return <Navigate to="/login" replace />;
  
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/shared/:token" element={<SharedPartnerPage />} />
          
          {/* Protected App Routes */}
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/today" replace />} />
            <Route path="today" element={<TodayPage />} />
            <Route path="backlog" element={<BacklogPage />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="opportunities" element={<OpportunitiesPage />} />
            <Route path="captures" element={<CapturesPage />} />
            <Route path="vault" element={<VaultPage />} />
            <Route path="partner" element={<PartnerPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
