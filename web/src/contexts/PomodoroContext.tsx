import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";

type Phase = "work" | "break";

interface PomodoroContextType {
  timeRemaining: number;
  phase: Phase;
  isRunning: boolean;
  workDuration: number;
  isActiveSession: boolean;
  setWorkDuration: (mins: number) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipPhase: () => void;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const [workDuration, setWorkDuration] = useState(25); // mins
  const [phase, setPhase] = useState<Phase>("work");
  const [timeRemaining, setTimeRemaining] = useState(workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isActiveSession, setIsActiveSession] = useState(false); // True if a session has been started at all

  const location = useLocation();
  const isPomodoroRoute = location.pathname === "/pomodoro";

  // Auto-pause if navigating away
  useEffect(() => {
    if (!isPomodoroRoute && isRunning) {
      setIsRunning(false);
    }
  }, [isPomodoroRoute, isRunning]);

  // Sync initial time when work duration changes (if not running/active)
  useEffect(() => {
    if (!isActiveSession && phase === "work") {
      setTimeRemaining(workDuration * 60);
    }
  }, [workDuration, isActiveSession, phase]);

  // Main Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeRemaining === 0) {
      // Phase Complete
      if (phase === "work") {
        setPhase("break");
        setTimeRemaining(5 * 60); // 5 min break
      } else {
        setPhase("work");
        setTimeRemaining(workDuration * 60);
        setIsRunning(false); // Auto-pause after full cycle
        setIsActiveSession(false);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeRemaining, phase, workDuration]);

  const startTimer = () => {
    setIsRunning(true);
    setIsActiveSession(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsActiveSession(false);
    setPhase("work");
    setTimeRemaining(workDuration * 60);
  };

  const skipPhase = () => {
    if (phase === "work") {
      setPhase("break");
      setTimeRemaining(5 * 60);
    } else {
      setPhase("work");
      setTimeRemaining(workDuration * 60);
      setIsRunning(false);
      setIsActiveSession(false);
    }
  };

  return (
    <PomodoroContext.Provider
      value={{
        timeRemaining,
        phase,
        isRunning,
        workDuration,
        isActiveSession,
        setWorkDuration,
        startTimer,
        pauseTimer,
        resetTimer,
        skipPhase,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (!context) throw new Error("usePomodoro must be used within PomodoroProvider");
  return context;
}
