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
    <div className="fixed bottom-0 left-0 right-0 md:bottom-4 md:left-4 md:right-4 bg-white brutal-border brutal-shadow-lg p-4 md:p-6 z-[100] animate-in slide-in-from-bottom-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-start md:items-center gap-3">
        <div className="p-3 bg-[#a8e6cf] brutal-border shrink-0">
          <ShieldCheck className="w-6 h-6 text-black" />
        </div>
        <div>
          <p className="text-base font-black text-black uppercase tracking-wide">
            Privacy & Cookies
          </p>
          <p className="text-sm font-medium text-black/80 mt-1 max-w-2xl">
            We use cookies and local caching to ensure you get the best
            experience, including offline access. By continuing to use Nest, you
            agree to our Privacy Policy and the use of caching.
          </p>
        </div>
      </div>
      <div className="flex w-full md:w-auto gap-3 shrink-0 mt-4 md:mt-0">
        <button
          onClick={accept}
          className="flex-1 md:flex-none brutal-btn bg-black text-white px-8 py-3 text-sm font-black uppercase tracking-widest"
        >
          I Accept
        </button>
      </div>
    </div>
  );
}
