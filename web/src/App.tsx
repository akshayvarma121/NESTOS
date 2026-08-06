import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ReactLenis } from "lenis/react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import LandingPage from "./pages/LandingPage";
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
import HelpPage from "./pages/HelpPage";
import { HelpProvider } from "./contexts/HelpContext";
import BrutalistTour from "./components/BrutalistTour";
import BuddyPage from "./pages/BuddyPage";
import { ReminderProvider } from "./contexts/ReminderContext";

import type { ReactNode } from "react";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) return <div className="p-6">Loading...</div>;
  if (!session) return <Navigate to="/" replace />;

  return children;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) return <div className="p-6">Loading...</div>;
  if (session) return <Navigate to="/focus" replace />;

  return children;
}

function CatchAllRoute() {
  const { session, loading } = useAuth();
  if (loading) return null;
  return session ? <Navigate to="/focus" replace /> : <Navigate to="/" replace />;
}

export default function App() {
  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone;

    if (isStandalone) {
      const handleContextMenu = (e: MouseEvent) => {
        // Allow context menu on inputs and textareas
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        e.preventDefault();
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        // F12, Ctrl+Shift+I/J/C, Ctrl+U, Cmd+Option+I/J/C
        if (
          e.key === "F12" ||
          (e.ctrlKey &&
            e.shiftKey &&
            (e.key.toLowerCase() === "i" ||
              e.key.toLowerCase() === "j" ||
              e.key.toLowerCase() === "c")) ||
          (e.ctrlKey && e.key.toLowerCase() === "u") ||
          (e.metaKey &&
            e.altKey &&
            (e.key.toLowerCase() === "i" ||
              e.key.toLowerCase() === "j" ||
              e.key.toLowerCase() === "c")) ||
          (e.metaKey && e.key.toLowerCase() === "u")
        ) {
          e.preventDefault();
        }
      };

      document.addEventListener("contextmenu", handleContextMenu);
      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("contextmenu", handleContextMenu);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, []);

  return (
    <ReactLenis root>
      <AuthProvider>
        <TimerProvider>
          <HelpProvider>
            <ReminderProvider>
              <BrowserRouter>
              <BrutalistTour />
              <FloatingTimerPill />
              <Routes>

                {/* Public Auth Routes */}
                <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                <Route path="/shared/:token" element={<SharedPartnerPage />} />

                {/* Protected App Routes */}
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
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
                  <Route path="help" element={<HelpPage />} />
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

                {/* Independent Route for Buddy Window */}
                <Route path="/buddy" element={<BuddyPage />} />

                {/* Catch-all Route for 404s */}
                <Route path="*" element={<CatchAllRoute />} />
              </Routes>
              </BrowserRouter>
            </ReminderProvider>
          </HelpProvider>
        </TimerProvider>
      </AuthProvider>
    </ReactLenis>
  );
}
