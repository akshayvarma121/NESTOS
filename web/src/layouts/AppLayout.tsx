import { Outlet, NavLink } from "react-router-dom";
import DesktopSidebar from "./DesktopSidebar";
import MobileBottomTabs from "./MobileBottomTabs";
import { useState, useEffect } from "react";
import QuickCapturePanel from "../components/QuickCapturePanel";
import PrivacyBanner from "../components/PrivacyBanner";
import { Plus, Bell, X, WifiOff, Download } from "lucide-react";
import { api } from "../lib/api";

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
  const [showToast, setShowToast] = useState(false);
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
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
      {/* Offline Banner */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 bg-[var(--bg-surface-raised)] border-b border-[var(--border-hairline)] px-4 py-1.5 flex items-center justify-center gap-2 z-[60]">
          <WifiOff className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            Offline — showing last synced data
          </span>
        </div>
      )}

      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden lg:flex w-[240px] flex-shrink-0 border-r border-[var(--border-hairline)] bg-[var(--bg-surface)] pt-6">
        <DesktopSidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+60px)] lg:pb-0 relative pt-6">
        {/* Contextual PWA Install Banner */}
        {deferredPrompt && (
          <div className="mx-6 mb-6 p-4 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--bg-surface-raised)] rounded-lg">
                <Download className="w-5 h-5 text-[var(--text-primary)]" />
              </div>
              <div>
                <p className="text-sm font-medium">Install NestOS App</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Add to your home screen for a faster, full-screen experience.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleInstallClick}
                className="flex-1 sm:flex-none bg-[var(--text-primary)] text-[var(--bg-base)] px-4 py-2 rounded-md text-sm font-medium hover:bg-white transition-colors"
              >
                Install
              </button>
              <button
                onClick={() => setDeferredPrompt(null)}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Contextual Push Banner */}
        {showPushBanner && (
          <div className="mx-6 mb-6 p-4 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--bg-surface-raised)] rounded-lg">
                <Bell className="w-5 h-5 text-[var(--text-primary)]" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Get a morning briefing on your phone?
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Plus alerts for upcoming application deadlines.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="flex-1 sm:flex-none bg-[var(--text-primary)] text-[var(--bg-base)] px-4 py-2 rounded-md text-sm font-medium hover:bg-white transition-colors"
              >
                {subscribing ? "Enabling..." : "Enable"}
              </button>
              <button
                onClick={dismissPush}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <Outlet />
      </main>

      {/* Mobile Bottom Tabs (hidden on desktop) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-[var(--border-hairline)] bg-[var(--bg-surface-raised)] pb-safe z-40">
        <MobileBottomTabs />
      </div>

      {/* Quick Capture Modal */}
      <QuickCapturePanel
        isOpen={isCaptureOpen}
        onClose={() => setIsCaptureOpen(false)}
      />

      {/* Privacy & Cookie Consent Banner */}
      <PrivacyBanner />

      {/* Non-blocking Milestone Toast */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-[var(--text-primary)] text-[var(--bg-base)] px-4 py-3 rounded-lg shadow-2xl z-50 flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
          <span className="text-sm font-medium">
            New milestone captured — draft a post?
          </span>
          <a
            href="/captures"
            onClick={() => setShowToast(false)}
            className="text-xs bg-[var(--bg-base)] text-[var(--text-primary)] px-2 py-1 rounded"
          >
            View
          </a>
        </div>
      )}

    </div>
  );
}
