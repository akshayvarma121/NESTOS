import { useLocation, useNavigate } from "react-router-dom";
import { useTimer } from "../contexts/TimerContext";
import { Activity, Clock } from "lucide-react";

export default function FloatingTimerPill() {
  const { isActive, sessionSeconds, mode, pomodoroLeft } = useTimer();
  const location = useLocation();
  const navigate = useNavigate();

  // Hide if on the timer page, or if the timer is not active AND has no session data
  if (location.pathname === "/timer" || (!isActive && sessionSeconds === 0)) {
    return null;
  }

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const mStr = mins.toString().padStart(2, "0");
    const sStr = secs.toString().padStart(2, "0");

    if (hrs > 0) return `${hrs}:${mStr}:${sStr}`;
    return `${mStr}:${sStr}`;
  };

  const displayTime =
    mode === "pomodoro" ? formatTime(pomodoroLeft) : formatTime(sessionSeconds);

  return (
    <div
      onClick={() => navigate("/timer")}
      className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50 cursor-pointer animate-in slide-in-from-bottom-8 fade-in duration-300 hover:-translate-y-1 transition-transform"
    >
      <div
        className={`flex items-center gap-3 px-5 py-3 rounded-full border-2 border-[var(--border-brutal)] shadow-[4px_4px_0px_var(--border-brutal)] ${isActive ? "bg-[#ffeb3b]" : "bg-[var(--bg-surface-raised)]"}`}
      >
        {mode === "stopwatch" ? (
          <Activity
            className={`w-5 h-5 ${isActive ? "text-black animate-pulse" : "text-[var(--text-primary)]"}`}
          />
        ) : (
          <Clock
            className={`w-5 h-5 ${isActive ? "text-black animate-pulse" : "text-[var(--text-primary)]"}`}
          />
        )}
        <span
          className={`font-mono font-black text-lg tracking-wider ${isActive ? "text-black" : "text-[var(--text-primary)]"}`}
        >
          {displayTime}
        </span>
        {isActive && (
          <span className="flex h-2 w-2 absolute top-2 right-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-[var(--border-brutal)]"></span>
          </span>
        )}
      </div>
    </div>
  );
}
