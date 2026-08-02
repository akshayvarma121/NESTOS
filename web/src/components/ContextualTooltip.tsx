import { useState, useEffect, type ReactNode } from "react";
import { useHelp } from "../contexts/HelpContext";
import { guidanceRegistry } from "../lib/guidanceRegistry";
import { X } from "lucide-react";

type ContextualTooltipProps = {
  featureId: string;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
};

export default function ContextualTooltip({
  featureId,
  children,
  position = "bottom",
}: ContextualTooltipProps) {
  const { seenFeatures, markSeen, isTourActive } = useHelp();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if not seen and tour is NOT active (prevent overlap)
    if (!seenFeatures[featureId] && !isTourActive) {
      // Delay showing slightly to let layout settle and make it feel deliberate
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [featureId, seenFeatures, isTourActive]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    markSeen(featureId);
  };

  const guidance = guidanceRegistry[featureId];
  if (!guidance) {
    console.warn(`ContextualTooltip: No guidance found for featureId "${featureId}"`);
    return <>{children}</>;
  }

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div className="relative inline-block">
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 w-64 p-3 bg-[var(--bg-surface-raised)] text-[var(--text-primary)] border-2 border-[var(--border-hairline)] shadow-[4px_4px_0px_0px_var(--border-hairline)] animate-in fade-in slide-in-from-${position}-2 ${positionClasses[position]}`}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-black font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
              {guidance.title}
            </h4>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-[var(--bg-base)] hover:text-[var(--text-primary)] border-2 border-transparent hover:border-[var(--border-hairline)] transition-colors text-[var(--text-secondary)]"
              title="Dismiss"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs font-bold leading-tight">{guidance.text}</p>
        </div>
      )}
    </div>
  );
}
