import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { guidanceRegistry } from "../lib/guidanceRegistry";

type HelpContextType = {
  hasOnboarded: boolean;
  seenFeatures: Record<string, boolean>;
  isTourActive: boolean;
  currentTourStep: number;
  tourSteps: string[];
  markSeen: (featureId: string) => void;
  startTour: () => void;
  nextTourStep: () => void;
  skipTour: () => void;
  resetAll: () => void;
};

const HelpContext = createContext<HelpContextType | null>(null);

const TOUR_STEPS = [
  "focus_dashboard",
  "backlog_philosophy",
  "goal_engine",
  "calendar_deadlines",
  "notes_scratchpad",
  "analytics_dashboard",
  "partner_beta",
  "vault_intro",
  "settings_overview",
  "help_page"
];

export function HelpProvider({ children }: { children: ReactNode }) {
  const [hasOnboarded, setHasOnboarded] = useState(true); // Default true until loaded
  const [seenFeatures, setSeenFeatures] = useState<Record<string, boolean>>({});
  
  // Tour state
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);

  useEffect(() => {
    // Load state from localStorage on mount
    const savedOnboarded = localStorage.getItem("nest_has_onboarded");
    const savedFeatures = localStorage.getItem("nest_seen_features");

    if (savedOnboarded === null) {
      setHasOnboarded(false);
      setIsTourActive(true); // Auto-start on first login
    } else {
      setHasOnboarded(savedOnboarded === "true");
    }

    if (savedFeatures) {
      try {
        setSeenFeatures(JSON.parse(savedFeatures));
      } catch (e) {
        console.error("Failed to parse seen features");
      }
    }
  }, []);

  const markSeen = (featureId: string) => {
    setSeenFeatures((prev) => {
      const next = { ...prev, [featureId]: true };
      localStorage.setItem("nest_seen_features", JSON.stringify(next));
      return next;
    });
  };

  const startTour = () => {
    setIsTourActive(true);
    setCurrentTourStep(0);
    setHasOnboarded(false); // Reset onboarding flag if restarting
    localStorage.removeItem("nest_has_onboarded");
  };

  const nextTourStep = () => {
    if (currentTourStep < TOUR_STEPS.length - 1) {
      setCurrentTourStep(prev => prev + 1);
    } else {
      skipTour(); // End of tour
    }
  };

  const skipTour = () => {
    setIsTourActive(false);
    setHasOnboarded(true);
    localStorage.setItem("nest_has_onboarded", "true");
    
    // Also mark tour steps as seen in the registry so they don't pop up as tooltips
    TOUR_STEPS.forEach(step => markSeen(step));
  };

  const resetAll = () => {
    localStorage.removeItem("nest_has_onboarded");
    localStorage.removeItem("nest_seen_features");
    setHasOnboarded(false);
    setSeenFeatures({});
    setIsTourActive(true);
    setCurrentTourStep(0);
  };

  return (
    <HelpContext.Provider
      value={{
        hasOnboarded,
        seenFeatures,
        isTourActive,
        currentTourStep,
        tourSteps: TOUR_STEPS,
        markSeen,
        startTour,
        nextTourStep,
        skipTour,
        resetAll,
      }}
    >
      {children}
    </HelpContext.Provider>
  );
}

export function useHelp() {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error("useHelp must be used within a HelpProvider");
  }
  return context;
}
