import { useEffect, useState } from "react";

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);

  useEffect(() => {
    let startY = 0;
    let currentY = 0;
    const threshold = 100; // pixels to pull before refreshing

    const handleTouchStart = (e: TouchEvent) => {
      // Only start pull-to-refresh if we are at the top of the page
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
      } else {
        startY = 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!startY) return;

      currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;

      // Only handle downward pulls
      if (pullDistance > 0) {
        // Prevent default scrolling when pulling down at the top
        if (e.cancelable) e.preventDefault();

        // Calculate a resistance factor so it gets harder to pull the further you go
        const progress = Math.min(pullDistance / threshold, 1.2);
        setPullProgress(progress);
      }
    };

    const handleTouchEnd = async () => {
      if (!startY) return;

      if (pullProgress >= 1 && !isRefreshing) {
        setIsRefreshing(true);
        if (navigator.vibrate) navigator.vibrate(15);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullProgress(0);
        }
      } else {
        setPullProgress(0);
      }

      startY = 0;
      currentY = 0;
    };

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onRefresh, isRefreshing, pullProgress]);

  return { isRefreshing, pullProgress };
}
