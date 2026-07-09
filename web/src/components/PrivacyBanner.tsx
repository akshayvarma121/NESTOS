import { useState, useEffect } from "react";
import { ShieldCheck, X } from "lucide-react";

export default function PrivacyBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasConsent = localStorage.getItem("privacy_consent");
    if (!hasConsent) {
      setShow(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("privacy_consent", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[var(--bg-surface-raised)] border-t border-[var(--border-hairline)] p-4 md:p-6 z-[100] shadow-2xl animate-in slide-in-from-bottom-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-start md:items-center gap-3">
        <div className="p-2 bg-[var(--bg-base)] rounded-lg shrink-0">
          <ShieldCheck className="w-5 h-5 text-[var(--text-primary)]" />
        </div>
        <div>
          <p className="text-sm font-medium">Privacy & Cookies</p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 max-w-2xl">
            We use cookies and local caching to ensure you get the best
            experience, including offline access. By continuing to use NestOS,
            you agree to our Privacy Policy and the use of caching.
          </p>
        </div>
      </div>
      <div className="flex w-full md:w-auto gap-3 shrink-0">
        <button
          onClick={accept}
          className="flex-1 md:flex-none bg-[var(--text-primary)] text-[var(--bg-base)] px-6 py-2 rounded-md text-sm font-medium hover:bg-white transition-colors"
        >
          I Accept
        </button>
      </div>
    </div>
  );
}
