import { Outlet, NavLink } from "react-router-dom";
import DesktopSidebar from "./DesktopSidebar";
import MobileBottomTabs from "./MobileBottomTabs";
import { useState, useEffect } from "react";
import PrivacyBanner from "../components/PrivacyBanner";
import EditTimetablePanel from "../components/EditTimetablePanel";
import CreateOpportunityPanel from "../components/CreateOpportunityPanel";
import { Plus, Bell, X, WifiOff, Download } from "lucide-react";
import { api } from "../lib/api";
import { useHotkeys } from "../lib/useHotkeys";
import { useSwipeNavigation } from "../lib/useSwipe";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function AppLayout() {
  useSwipeNavigation();
  const [showToast, setShowToast] = useState(false);
  
  // Global Modal States
  const [isTimetableOpen, setIsTimetableOpen] = useState(false);
  const [isOpportunityOpen, setIsOpportunityOpen] = useState(false);
  
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Push Notification state
  const [showPushBanner, setShowPushBanner] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    // Offline Listener
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Milestone Listener
    const handleMilestone = () => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    };
    window.addEventListener("milestone_reached", handleMilestone);

    // Vault Copy Listener
    const handleVaultCopy = (e: any) => {
      alert(e.detail || "Copied to clipboard");
    };
    window.addEventListener("vault_copy", handleVaultCopy);

    // Global Modals Listeners
    const handleTimetableOpen = () => setIsTimetableOpen(true);
    const handleOpportunityOpen = () => setIsOpportunityOpen(true);
    
    window.addEventListener("open_timetable_creator", handleTimetableOpen);
    window.addEventListener("open_opportunity_creator", handleOpportunityOpen);

    // PWA Install Prompt Listener
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Contextual Push check
    if ("Notification" in window && "serviceWorker" in navigator) {
      if (
        Notification.permission === "default" &&
        !localStorage.getItem("push_dismissed")
      ) {
        setTimeout(() => setShowPushBanner(true), 3000);
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("milestone_reached", handleMilestone);
      window.removeEventListener("vault_copy", handleVaultCopy);
      window.removeEventListener("open_timetable_creator", handleTimetableOpen);
      window.removeEventListener("open_opportunity_creator", handleOpportunityOpen);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted" && VAPID_PUBLIC_KEY) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        await api.post("/push/subscribe", subscription.toJSON());
        setShowPushBanner(false);
      }
    } catch (e) {
      console.error("Push subscription failed", e);
    } finally {
      setSubscribing(false);
    }
  };

  const dismissPush = () => {
    localStorage.setItem("push_dismissed", "true");
    setShowPushBanner(false);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="flex h-[100dvh] w-full bg-[var(--bg-base)] overflow-hidden">
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden lg:flex flex-shrink-0 border-r-4 border-black bg-[var(--bg-surface)] pt-6 transition-all duration-300 relative z-20">
        <DesktopSidebar />
      </div>

      {/* WCO Drag Region */}
      <div className="titlebar-drag-region" />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+60px)] lg:pb-0 relative pt-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Tabs (hidden on desktop) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t-4 border-black bg-[var(--bg-surface-raised)] pb-safe z-40">
        <MobileBottomTabs />
      </div>

      {/* Global Modals */}
      <EditTimetablePanel
        isOpen={isTimetableOpen}
        onClose={() => setIsTimetableOpen(false)}
        onUpdate={() => window.dispatchEvent(new Event("refresh_data"))}
      />
      
      <CreateOpportunityPanel
        isOpen={isOpportunityOpen}
        onClose={() => setIsOpportunityOpen(false)}
        onSuccess={() => window.dispatchEvent(new Event("refresh_data"))}
      />

      {/* Privacy & Cookie Consent Banner */}
      <PrivacyBanner />

      {/* Non-blocking Milestone Toast */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-[var(--text-primary)] text-[var(--bg-base)] px-4 py-3 brutal-border brutal-shadow-lg z-50 flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
          <span className="text-sm font-bold">
            New milestone captured — draft a post?
          </span>
          <a
            href="/captures"
            onClick={() => setShowToast(false)}
            className="text-xs bg-[var(--bg-base)] text-[var(--text-primary)] px-2 py-1 rounded hover:scale-[1.02] transition-transform"
          >
            View
          </a>
        </div>
      )}

      {/* Floating Toast Container (Bottom Right Desktop, Top Mobile) */}
      <div className="fixed top-4 right-4 left-4 lg:top-auto lg:left-auto lg:bottom-6 lg:right-6 z-[60] flex flex-col gap-3 pointer-events-none">
        {/* Offline Banner */}
        {isOffline && (
          <div className="bg-[#ffeb3b] brutal-border brutal-shadow px-4 py-3 flex items-center justify-center gap-2 pointer-events-auto animate-in fade-in slide-in-from-top-2 lg:slide-in-from-bottom-2">
            <WifiOff className="w-5 h-5 text-black" />
            <span className="text-sm text-black font-bold">
              Offline — showing last synced data
            </span>
          </div>
        )}

        {/* Contextual PWA Install Banner */}
        {deferredPrompt && (
          <div className="p-4 bg-[#a8e6cf] brutal-border brutal-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pointer-events-auto animate-in fade-in slide-in-from-top-2 lg:slide-in-from-bottom-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white brutal-border">
                <Download className="w-6 h-6 text-black" />
              </div>
              <div>
                <p className="text-base font-bold text-black">Install Nest</p>
                <p className="text-xs font-medium text-black/80 hidden sm:block">
                  Add to home screen.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleInstallClick}
                className="flex-1 sm:flex-none bg-black text-white px-4 py-2 brutal-border text-sm font-bold hover:translate-x-1 hover:translate-y-1 transition-transform"
              >
                Install
              </button>
              <button
                onClick={() => setDeferredPrompt(null)}
                className="p-1.5 text-black hover:bg-black hover:text-white brutal-border transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Contextual Push Banner */}
        {showPushBanner && !deferredPrompt && (
          <div className="p-4 bg-[#ffb6c1] brutal-border brutal-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pointer-events-auto animate-in fade-in slide-in-from-top-2 lg:slide-in-from-bottom-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white brutal-border">
                <Bell className="w-6 h-6 text-black" />
              </div>
              <div>
                <p className="text-base font-bold text-black">
                  Morning briefings?
                </p>
                <p className="text-xs font-medium text-black/80 hidden sm:block">
                  Get alerts on your phone.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="flex-1 sm:flex-none bg-black text-white px-4 py-2 brutal-border text-sm font-bold hover:translate-x-1 hover:translate-y-1 transition-transform"
              >
                {subscribing ? "..." : "Enable"}
              </button>
              <button
                onClick={dismissPush}
                className="p-1.5 text-black hover:bg-black hover:text-white brutal-border transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
