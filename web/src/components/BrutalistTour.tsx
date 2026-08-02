import { useEffect, useState } from "react";
import { useHelp } from "../contexts/HelpContext";
import { guidanceRegistry } from "../lib/guidanceRegistry";
import { useNavigate, useLocation } from "react-router-dom";
import { X, ArrowRight, Check } from "lucide-react";

const TOUR_ROUTES: Record<string, string> = {
  focus_dashboard: "/focus",
  backlog_philosophy: "/backlog",
  goal_engine: "/goals",
  calendar_deadlines: "/calendar",
  notes_scratchpad: "/notes",
  analytics_dashboard: "/routines-history",
  partner_beta: "/partner",
  vault_intro: "/vault",
  settings_overview: "/settings",
  help_page: "/help"
};

export default function BrutalistTour() {
  const { isTourActive, currentTourStep, tourSteps, nextTourStep, skipTour } = useHelp();
  const navigate = useNavigate();
  const location = useLocation();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const stepId = tourSteps[currentTourStep];
  const guidance = stepId ? guidanceRegistry[stepId] : null;

  useEffect(() => {
    if (!isTourActive || !stepId) return;

    // Ensure we are on the right route for this step
    const targetRoute = TOUR_ROUTES[stepId];
    if (targetRoute && location.pathname !== targetRoute) {
      navigate(targetRoute);
      return; // Wait for navigation to complete
    }

    // Try to find the element
    const findElement = () => {
      const el = document.querySelector(`[data-tour="${stepId}"]`);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    findElement();
    // Poll just in case the element renders asynchronously (like data loading)
    const interval = setInterval(findElement, 500);
    window.addEventListener("resize", findElement);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", findElement);
    };
  }, [isTourActive, stepId, location.pathname, navigate]);

  if (!isTourActive || !guidance) return null;

  const isLastStep = currentTourStep === tourSteps.length - 1;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Semi-transparent backdrop with a cutout (using box-shadow hack or svg) 
          For a true brutalist feel without complex svg cutouts, we will just use a stark backdrop.
          To make the target clickable, we could leave a hole, but a standard tour blocks interaction.
      */}
      <div className="absolute inset-0 bg-black/60 pointer-events-auto" onClick={skipTour} />
      
      {/* Highlight Box over target element */}
      {targetRect && (
        <div 
          className="absolute border-4 border-[#ffeb3b] pointer-events-none transition-all duration-300"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        >
          {/* Animated corner accents for brutalist flair */}
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-[#ffeb3b]" />
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#ffeb3b]" />
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#ffeb3b]" />
          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#ffeb3b]" />
        </div>
      )}

      {/* The brutalist tooltip dialog */}
      <div 
        className="absolute z-10 pointer-events-auto bg-[#ffeb3b] text-black border-4 border-black brutal-shadow-lg p-6 w-[320px] transition-all duration-300"
        style={
          targetRect
            ? {
                // Position it below or above the target depending on space
                top: targetRect.bottom + 24 > window.innerHeight - 220 
                     ? Math.max(16, targetRect.top - 220) 
                     : targetRect.bottom + 24,
                left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 340))
              }
            : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" } // Center fallback
        }
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-black uppercase tracking-widest">{guidance.title}</h2>
          <button 
            onClick={skipTour}
            className="p-1 hover:bg-black hover:text-white border-2 border-transparent hover:border-black transition-colors"
            title="Skip Tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="font-bold text-sm mb-6 leading-relaxed">
          {guidance.text}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <span className="font-mono text-xs font-black opacity-60">
            {currentTourStep + 1} / {tourSteps.length}
          </span>
          <button
            onClick={nextTourStep}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 border-2 border-black hover:-translate-y-1 hover:-translate-x-1 hover:brutal-shadow-sm transition-all text-sm font-bold uppercase tracking-wider"
          >
            {isLastStep ? (
              <>Got it <Check className="w-4 h-4" /></>
            ) : (
              <>Next <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
