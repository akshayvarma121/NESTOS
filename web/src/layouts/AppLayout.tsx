import { Outlet } from 'react-router-dom';
import DesktopSidebar from './DesktopSidebar';
import MobileBottomTabs from './MobileBottomTabs';
import { useState, useEffect } from 'react';
import QuickCapturePanel from '../components/QuickCapturePanel';
import { Plus } from 'lucide-react';

export default function AppLayout() {
  const [showToast, setShowToast] = useState(false);
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);

  useEffect(() => {
    const handleMilestone = () => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    };

    window.addEventListener('milestone_reached', handleMilestone);
    return () => window.removeEventListener('milestone_reached', handleMilestone);
  }, []);

  return (
    <div className="flex h-screen w-full bg-[var(--bg-base)] overflow-hidden">
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden lg:flex w-[240px] flex-shrink-0 border-r border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <DesktopSidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+60px)] lg:pb-0 relative">
        <Outlet />
      </main>

      {/* Mobile Bottom Tabs (hidden on desktop) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-[var(--border-hairline)] bg-[var(--bg-surface-raised)] pb-safe z-40">
        <MobileBottomTabs />
      </div>

      {/* Floating Action Button (FAB) for Quick Capture */}
      <button
        onClick={() => setIsCaptureOpen(true)}
        className="fixed bottom-[80px] lg:bottom-8 right-6 lg:right-8 w-14 h-14 bg-[var(--text-primary)] text-[var(--bg-base)] rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Quick Capture Modal */}
      <QuickCapturePanel isOpen={isCaptureOpen} onClose={() => setIsCaptureOpen(false)} />

      {/* Non-blocking Milestone Toast */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-[var(--text-primary)] text-[var(--bg-base)] px-4 py-3 rounded-lg shadow-2xl z-50 flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
          <span className="text-sm font-medium">New milestone captured — draft a post?</span>
          <a href="/captures" onClick={() => setShowToast(false)} className="text-xs bg-[var(--bg-base)] text-[var(--text-primary)] px-2 py-1 rounded">View</a>
        </div>
      )}
    </div>
  );
}
