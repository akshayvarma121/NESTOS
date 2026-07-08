import { Outlet } from 'react-router-dom';
import DesktopSidebar from './DesktopSidebar';
import MobileBottomTabs from './MobileBottomTabs';

export default function AppLayout() {
  return (
    <div className="flex h-screen w-full bg-[var(--bg-base)] overflow-hidden">
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden lg:flex w-[240px] flex-shrink-0 border-r border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <DesktopSidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+60px)] lg:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Tabs (hidden on desktop) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-[var(--border-hairline)] bg-[var(--bg-surface-raised)] pb-safe">
        <MobileBottomTabs />
      </div>
    </div>
  );
}
