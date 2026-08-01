import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { api } from "../lib/api";

type TimerMode = "stopwatch" | "pomodoro";

interface TimerContextType {
  mode: TimerMode;
  setMode: (mode: TimerMode) => void;
  isActive: boolean;
  sessionSeconds: number;
  pomodoroDuration: number;
  setPomodoroDuration: (minutes: number) => void;
  pomodoroLeft: number;
  setPomodoroLeft: (seconds: number) => void;
  startSession: () => void;
  pauseSession: () => void;
  stopSession: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<TimerMode>("stopwatch");
  const [isActive, setIsActive] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  const [pomodoroDuration, setPomodoroDuration] = useState(25);
  const [pomodoroLeft, setPomodoroLeft] = useState(25 * 60);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  const completeSession = async (
    durationSecs: number,
    sessionMode: TimerMode,
  ) => {
    try {
      await api.post("/timer/sessions", {
        mode: sessionMode,
        duration_seconds: durationSecs,
      });
      triggerHaptic();
    } catch (err) {
      console.error("Failed to save session", err);
    }
  };

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSessionSeconds((s) => s + 1);

        if (mode === "pomodoro") {
          setPomodoroLeft((prev) => {
            if (prev <= 1) {
              completeSession(pomodoroDuration * 60, "pomodoro");
              setIsActive(false);
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, mode, pomodoroDuration]);

  const startSession = () => setIsActive(true);

  const pauseSession = () => setIsActive(false);

  const stopSession = async () => {
    setIsActive(false);
    if (sessionSeconds > 0) {
      await completeSession(sessionSeconds, mode);
    }
    setSessionSeconds(0);
    if (mode === "pomodoro") {
      setPomodoroLeft(pomodoroDuration * 60);
    }
  };

  return (
    <TimerContext.Provider
      value={{
        mode,
        setMode,
        isActive,
        sessionSeconds,
        pomodoroDuration,
        setPomodoroDuration,
        pomodoroLeft,
        setPomodoroLeft,
        startSession,
        pauseSession,
        stopSession,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
}
