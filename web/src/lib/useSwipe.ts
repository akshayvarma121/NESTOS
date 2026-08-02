import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SWIPE_THRESHOLD = 90; // minimum pixels moved to register a swipe
const VERTICAL_THRESHOLD = 50; // maximum vertical deviation allowed

// Define the order of swipeable tabs
const SWIPE_ROUTES = ["/focus", "/calendar", "/backlog"];

export function useSwipeNavigation() {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Only apply on mobile devices (or small screens)
    if (window.innerWidth > 1024) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Don't intercept swipe if they are interacting with a horizontally scrollable element
      let target = e.target as HTMLElement | null;
      while (target && target !== document.body) {
        // If an element is explicitly scrollable horizontally, ignore swipe
        if (target.scrollWidth > target.clientWidth) {
          const style = window.getComputedStyle(target);
          if (style.overflowX === "scroll" || style.overflowX === "auto") {
            return;
          }
        }
        target = target.parentElement;
      }

      touchStartX.current = e.changedTouches[0].screenX;
      touchStartY.current = e.changedTouches[0].screenY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;

      const dx = touchEndX - touchStartX.current;
      const dy = touchEndY - touchStartY.current;

      // Reset
      touchStartX.current = null;
      touchStartY.current = null;

      // Ensure it's a horizontal swipe, not diagonal/vertical
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dy) < VERTICAL_THRESHOLD) {
        const currentIndex = SWIPE_ROUTES.findIndex((r) => location.pathname.startsWith(r));
        if (currentIndex === -1) return; // Not on a swipeable route

        if (dx > 0) {
          // Swipe Right (Go to previous tab)
          if (currentIndex > 0) {
            navigate(SWIPE_ROUTES[currentIndex - 1]);
          }
        } else {
          // Swipe Left (Go to next tab)
          if (currentIndex < SWIPE_ROUTES.length - 1) {
            navigate(SWIPE_ROUTES[currentIndex + 1]);
          }
        }
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [location.pathname, navigate]);
}
