import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ReactLenis } from "lenis/react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import { TimerProvider } from "./contexts/TimerContext";
import FloatingTimerPill from "./components/FloatingTimerPill";
import AppLayout from "./layouts/AppLayout";
import FocusPage from "./pages/FocusPage";
import GoalsPage from "./pages/GoalsPage";
import BacklogPage from "./pages/BacklogPage";
import OpportunitiesPage from "./pages/OpportunitiesPage";
import VaultPage from "./pages/VaultPage";
import PartnerPage from "./pages/PartnerPage";
import SettingsPage from "./pages/SettingsPage";
import SharedPartnerPage from "./pages/SharedPartnerPage";
import NotesPage from "./pages/NotesPage";
import TimerPage from "./pages/TimerPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import CalendarPage from "./pages/CalendarPage";

import type { ReactNode } from "react";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) return <div className="p-6">Loading...</div>;
  if (!session) return <Navigate to="/login" replace />;

  return children;
}

export default function App() {
  return (
    <ReactLenis root>
      <AuthProvider>
        <TimerProvider>
          <BrowserRouter>
            <FloatingTimerPill />
            <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/shared/:token" element={<SharedPartnerPage />} />

            {/* Protected App Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/focus" replace />} />
              <Route path="focus" element={<FocusPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="routines-history" element={<AnalyticsPage />} />
              <Route path="backlog" element={<BacklogPage />} />
              <Route path="goals" element={<GoalsPage />} />
              <Route path="opportunities" element={<OpportunitiesPage />} />
              <Route path="vault" element={<VaultPage />} />
              <Route path="notes" element={<NotesPage />} />
              <Route path="partner" element={<PartnerPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Independent Protected Route for Timer (No AppLayout) */}
            <Route
              path="/timer"
              element={
                <ProtectedRoute>
                  <TimerPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TimerProvider>
    </AuthProvider>
    </ReactLenis>
  );
}
