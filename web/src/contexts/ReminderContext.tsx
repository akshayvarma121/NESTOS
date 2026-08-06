import { createContext, useContext, useState, useEffect, type ReactNode, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { api } from "../lib/api";
import { useAuth } from "./AuthContext";
import { useTimer } from "./TimerContext";
import { getLocalDateString, getLocalDayName } from "../lib/dateUtils";
import { BuddyCharacter } from "../components/BuddyCharacter";

export type ReminderRule = {
  id: string;
  label: string;
  message: string;
  icon?: string;
  enabled: boolean;
  schedule_type: 'interval' | 'dailyTime' | 'daysOfWeek';
  interval_minutes?: number;
  daily_time?: string;
  days_of_week?: number[];
  last_fired_at?: string;
};

export type Reminder = {
  id: string;
  message: string;
  icon?: string;
};

type ReminderContextType = {
  rules: ReminderRule[];
  fetchRules: () => Promise<void>;
  pushReminder: (reminder: Reminder) => void;
  activeReminder: Reminder | null;
  dismissReminder: () => void;
};

const ReminderContext = createContext<ReminderContextType | null>(null);

export function useReminders() {
  const ctx = useContext(ReminderContext);
  if (!ctx) throw new Error("useReminders must be used within ReminderProvider");
  return ctx;
}

export function ReminderProvider({ children }: { children: ReactNode }) {
  const { session, user } = useAuth();
  const timer = useTimer();
  
  const [rules, setRules] = useState<ReminderRule[]>([]);
  const [queue, setQueue] = useState<Reminder[]>([]);
  const [activeReminder, setActiveReminder] = useState<Reminder | null>(null);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  
  const [isHovered, setIsHovered] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Local state to track daily fired items (resets on reload, or we can use localStorage for persistence, but memory is fine for daily since rules run on mount)
  const firedRoutineIds = useRef<Set<string>>(new Set());
  const firedGoalIds = useRef<Set<string>>(new Set());

  // Extracted preferences
  const buddyRemindersEnabled = user?.user_metadata?.buddyRemindersEnabled !== false;
  const routineRemindersEnabled = user?.user_metadata?.routineRemindersEnabled !== false;
  const pomodoroRemindersEnabled = user?.user_metadata?.pomodoroRemindersEnabled !== false;
  const goalDeadlineRemindersEnabled = user?.user_metadata?.goalDeadlineRemindersEnabled === true;
  const goalDeadlineThresholds = user?.user_metadata?.goalDeadlineThresholds || [3, 1, 0];
  const buddyPipEnabled = user?.user_metadata?.buddyPipEnabled === true;

  // PiP Lifecycle
  useEffect(() => {
    if (!buddyPipEnabled || !buddyRemindersEnabled || !('documentPictureInPicture' in window)) {
      if (pipWindow) {
        pipWindow.close();
        setPipWindow(null);
      }
      return;
    }

    let isSubscribed = true;
    let newPipWindow: Window | null = null;

    if (!pipWindow) {
      const initPip = async () => {
        try {
          const pip = await (window as any).documentPictureInPicture.requestWindow({
            width: 160,
            height: 190,
          });
          
          if (!isSubscribed) {
            pip.close();
            return;
          }

          // Copy styles
          [...document.styleSheets].forEach((styleSheet) => {
            try {
              if (styleSheet.href) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = styleSheet.href;
                pip.document.head.appendChild(link);
              } else if (styleSheet.cssRules) {
                const style = document.createElement('style');
                [...styleSheet.cssRules].forEach((rule) => {
                  style.appendChild(document.createTextNode(rule.cssText));
                });
                pip.document.head.appendChild(style);
              }
            } catch (e) {
              // Ignore cross-origin stylesheet errors
            }
          });
          
          // Apply some base styles to PiP body
          pip.document.body.style.margin = '0';
          pip.document.body.style.padding = '0';
          pip.document.body.style.width = '100%';
          pip.document.body.style.height = '100%';
          pip.document.body.style.backgroundColor = 'transparent';
          pip.document.body.style.overflow = 'hidden';

          pip.addEventListener('pagehide', () => {
            if (isSubscribed) {
              setPipWindow(null);
              // Fallback to overlay cleanly if user manually closes native window
              import("../lib/supabase").then(({ supabase }) => {
                supabase.auth.updateUser({ data: { buddyPipEnabled: false } });
              });
            }
          });

          newPipWindow = pip;
          setPipWindow(pip);
        } catch (err) {
          console.error("Failed to enter PiP mode", err);
          import("../lib/supabase").then(({ supabase }) => {
            supabase.auth.updateUser({ data: { buddyPipEnabled: false } });
          });
        }
      };
      initPip();
    }

    return () => {
      isSubscribed = false;
      if (newPipWindow) {
        newPipWindow.close();
      }
    };
  }, [buddyPipEnabled, buddyRemindersEnabled, pipWindow]);

  const fetchRules = async () => {
    if (!session) return;
    try {
      const data = await api.get("/reminders");
      setRules(data);
    } catch (err) {
      console.error("Failed to fetch reminder rules:", err);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [session]);

  const markFired = async (ruleId: string) => {
    try {
      await api.patch(`/reminders/${ruleId}/fire`, {});
      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, last_fired_at: new Date().toISOString() } : r));
    } catch (err) {
      console.error("Failed to update last_fired_at:", err);
    }
  };

  const pushReminder = useCallback((reminder: Reminder) => {
    setQueue(prev => [...prev, reminder]);
  }, []);

  const dismissReminder = useCallback(() => {
    setActiveReminder(null);
  }, []);

  // Pomodoro direct hook
  const prevPomodoroRef = useRef(timer.pomodoroLeft);
  useEffect(() => {
    if (!pomodoroRemindersEnabled || !session) {
      prevPomodoroRef.current = timer.pomodoroLeft;
      return;
    }
    
    // Fired when pomodoro reaches 0
    if (timer.mode === 'pomodoro' && timer.pomodoroLeft === 0 && prevPomodoroRef.current > 0) {
      if (buddyRemindersEnabled) {
        pushReminder({
          id: crypto.randomUUID(),
          message: "Focus session complete!\nTake a break.",
          icon: "🍅"
        });
      }
    }
    prevPomodoroRef.current = timer.pomodoroLeft;
  }, [timer.pomodoroLeft, timer.mode, pomodoroRemindersEnabled, buddyRemindersEnabled, session, pushReminder]);

  // Queue processing
  useEffect(() => {
    if (!activeReminder && queue.length > 0) {
      const next = queue[0];
      setQueue(prev => prev.slice(1));
      setActiveReminder(next);
    }
  }, [activeReminder, queue]);

  // Auto-dismiss logic
  useEffect(() => {
    if (activeReminder && !isHovered) {
      dismissTimerRef.current = setTimeout(() => {
        dismissReminder();
      }, 5000);
    }
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [activeReminder, isHovered, dismissReminder]);

  // Scheduler logic
  useEffect(() => {
    if (!session) return;

    const thresholdsStr = JSON.stringify(goalDeadlineThresholds);

    const evaluate = async () => {
      const now = new Date();
      const currentDay = now.getDay();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const todayStr = getLocalDateString(now);

      // 1. Evaluate pos_reminder_rules
      rules.forEach(rule => {
        if (!rule.enabled) return;

        let shouldFire = false;
        const lastFired = rule.last_fired_at ? new Date(rule.last_fired_at) : null;
        const firedRecently = lastFired && (now.getTime() - lastFired.getTime() < 60000);

        if (firedRecently) return;

        switch (rule.schedule_type) {
          case 'interval': {
            if (rule.interval_minutes) {
              if (!lastFired) {
                shouldFire = true;
              } else {
                const diffMins = (now.getTime() - lastFired.getTime()) / (1000 * 60);
                if (diffMins >= rule.interval_minutes) {
                  shouldFire = true;
                }
              }
            }
            break;
          }
          case 'dailyTime': {
            if (rule.daily_time === currentTimeStr) {
              if (!lastFired || lastFired.toDateString() !== now.toDateString()) {
                shouldFire = true;
              }
            }
            break;
          }
          case 'daysOfWeek': {
            if (rule.days_of_week?.includes(currentDay) && rule.daily_time === currentTimeStr) {
              if (!lastFired || lastFired.toDateString() !== now.toDateString()) {
                shouldFire = true;
              }
            }
            break;
          }
        }

        if (shouldFire) {
          if (buddyRemindersEnabled) {
            pushReminder({
              id: crypto.randomUUID(),
              message: `${rule.label}\n${rule.message}`,
              icon: rule.icon || "🔔",
            });
          }
          markFired(rule.id); // ALWAYS track it even if buddyRemindersEnabled is false
        }
      });

      // 2. Routine Reminders
      if (routineRemindersEnabled) {
        try {
          const routinesRes = await api.get(`/routines/day?day=${getLocalDayName(now)}&date=${todayStr}`);
          const routines = routinesRes?.myRoutines || [];
          routines.forEach((r: any) => {
            if (r.status === "pending" && r.time_label) {
              if (currentTimeStr >= r.time_label && !firedRoutineIds.current.has(r.id)) {
                if (buddyRemindersEnabled) {
                  pushReminder({
                    id: crypto.randomUUID(),
                    message: `Routine time\n${r.title}`,
                    icon: "📅",
                  });
                }
                firedRoutineIds.current.add(r.id);
              }
            }
          });
        } catch (err) {
          console.error("Failed to evaluate routines for reminders", err);
        }
      }

      // 3. Goal Deadline Reminders
      if (goalDeadlineRemindersEnabled) {
        try {
          const goalsRes = await api.get("/macro-goals");
          const goals = goalsRes || [];
          const thresholds: number[] = JSON.parse(thresholdsStr);
          
          goals.forEach((g: any) => {
            if (g.deadline && !firedGoalIds.current.has(g.id)) {
              const deadlineDate = new Date(g.deadline + "T12:00:00"); 
              const todayDate = new Date(todayStr + "T12:00:00");
              const diffTime = deadlineDate.getTime() - todayDate.getTime();
              const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

              if (thresholds.includes(diffDays)) {
                // To avoid firing at midnight, fire after 09:00 AM once a day
                if (currentTimeStr >= "09:00") {
                  let daysStr = diffDays === 0 ? "today" : diffDays === 1 ? "tomorrow" : `in ${diffDays} days`;
                  if (diffDays < 0) daysStr = `${Math.abs(diffDays)} days ago`;

                  if (buddyRemindersEnabled) {
                    pushReminder({
                      id: crypto.randomUUID(),
                      message: `Goal Deadline\n${g.title} is due ${daysStr}!`,
                      icon: "🎯",
                    });
                  }
                  firedGoalIds.current.add(g.id);
                }
              }
            }
          });
        } catch (err) {
          console.error("Failed to evaluate goals for reminders", err);
        }
      }
    };

    const intervalId = setInterval(evaluate, 60000);
    const initialTimeout = setTimeout(evaluate, 5000); 

    return () => {
      clearInterval(intervalId);
      clearTimeout(initialTimeout);
    };
  }, [
    rules, session, pushReminder, 
    buddyRemindersEnabled, routineRemindersEnabled, goalDeadlineRemindersEnabled, 
    goalDeadlineThresholds
  ]); 

  const activeLines = activeReminder ? activeReminder.message.split('\n') : [];

  return (
    <ReminderContext.Provider value={{ rules, fetchRules, pushReminder, activeReminder, dismissReminder }}>
      {children}
      
      {/* Dev-only Trigger Panel */}
      {session && (
        <div className="fixed bottom-4 left-4 z-50 p-4 border-2 border-dashed border-red-500 bg-black/80 rounded flex flex-col gap-2 pointer-events-auto">
          <div className="text-xs text-red-500 font-bold mb-1">DEV REMINDER TRIGGER</div>
          <button 
            className="brutal-btn bg-white text-black px-3 py-1 text-xs"
            onClick={() => pushReminder({
              id: crypto.randomUUID(),
              message: "Test Reminder\nThis is a manually triggered test from the dev panel.",
              icon: "🔔"
            })}
          >
            Push Test Reminder
          </button>
        </div>
      )}

      {/* Active Reminder UI */}
      {activeReminder && buddyRemindersEnabled && (
        pipWindow ? (
          createPortal(
            <div 
              className="w-full h-full pointer-events-none flex items-center justify-center pt-4"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <BuddyCharacter 
                activeReminder={activeReminder} 
                onDismiss={dismissReminder} 
                isPip={true}
              />
            </div>,
            pipWindow.document.body
          )
        ) : (
          <div 
            className="fixed bottom-0 right-8 w-32 h-48 z-[99999] pointer-events-none"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <BuddyCharacter 
              activeReminder={activeReminder} 
              onDismiss={dismissReminder} 
            />
          </div>
        )
      )}
    </ReminderContext.Provider>
  );
}
