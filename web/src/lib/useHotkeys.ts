import { useEffect } from "react";

export function useHotkeys(
  keyCombo: string,
  callback: (e: KeyboardEvent) => void,
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keys = keyCombo.toLowerCase().split("+");
      const isCmdOrCtrl = keys.includes("cmd") || keys.includes("ctrl");
      const isShift = keys.includes("shift");
      const key = keys.find(
        (k) => k !== "cmd" && k !== "ctrl" && k !== "shift",
      );

      // Check if user is typing in an input field to avoid triggering shortcuts accidentally
      const activeElement = document.activeElement;
      const isInput =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA";

      // Allow Cmd/Ctrl combinations even in inputs, but prevent single letter shortcuts
      if (isInput && !isCmdOrCtrl) return;

      const cmdPressed = e.metaKey || e.ctrlKey;
      const shiftPressed = e.shiftKey;

      const keyMatches = key
        ? e.key.toLowerCase() === key.toLowerCase()
        : false;
      const cmdMatches = isCmdOrCtrl ? cmdPressed : !cmdPressed;
      const shiftMatches = isShift ? shiftPressed : !shiftPressed;

      if (keyMatches && cmdMatches && shiftMatches) {
        e.preventDefault();
        callback(e);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [keyCombo, callback]);
}
