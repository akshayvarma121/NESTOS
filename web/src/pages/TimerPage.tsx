import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { api } from "../lib/api";
import {
  Clock,
  Home,
  Activity,
  Check,
  Play,
  Square,
  Pause,
  Settings2,
} from "lucide-react";
import { getLocalDateString, getLocalDayName } from "../lib/dateUtils";
import { useTimer } from "../contexts/TimerContext";

export default function TimerPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [personalTodos, setPersonalTodos] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const [currentRoutine, setCurrentRoutine] = useState<any | null>(null);

  const {
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
  } = useTimer();

  // Live clock state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const todayStr = getLocalDateString();
        const [taskData, personalData, routinesData] = await Promise.all([
          api.get(`/scheduler/focus?date=${todayStr}`),
          api.get("/personal-todos"),
          api.get(`/routines/day?day=${getLocalDayName()}&date=${todayStr}`),
        ]);

        const activeTasks = (taskData || []).filter(
          (t: any) => t.status !== "skipped" && t.scheduled_date === todayStr,
        );

        setTasks(activeTasks);
        setPersonalTodos(personalData || []);
        setRoutines(routinesData?.myRoutines || []);
      } catch (err) {
        console.error("Failed to load tasks", err);
      }
    };
    fetchTasks();
  }, []);

  // Clock tick
  useEffect(() => {
    const clockTimer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

      if (routines.length > 0) {
        const sortedRoutines = [...routines].sort((a, b) =>
          (a.time_label || "24:00").localeCompare(b.time_label || "24:00"),
        );
        let active = sortedRoutines[0];
        for (let i = 0; i < sortedRoutines.length; i++) {
          const rTime = sortedRoutines[i].time_label || "00:00";
          if (timeStr >= rTime.split(" - ")[0]) {
            active = sortedRoutines[i];
          }
        }
        setCurrentRoutine(active);
      }
    }, 1000);
    return () => clearInterval(clockTimer);
  }, [routines]);

  const toggleTask = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "pending" : "done";
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)),
    );
    await api.patch(`/micro-tasks/${id}`, { status: newStatus });
  };

  const toggleTodo = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "pending" : "done";
    setPersonalTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)),
    );
    await api.patch(`/personal-todos/${id}`, { status: newStatus });
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const timeString = currentTime.toLocaleTimeString("en-US", { hour12: false });
  const [hours, minutes, seconds] = timeString.split(":");

  const pMins = Math.floor(pomodoroLeft / 60)
    .toString()
    .padStart(2, "0");
  const pSecs = (pomodoroLeft % 60).toString().padStart(2, "0");

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col p-4 md:p-8 animate-in fade-in duration-500 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--accent)]/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <header className="flex items-center justify-between z-10">
        <NavLink
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors bg-[var(--bg-surface)] px-4 py-2 rounded-full border border-[var(--border-hairline)] shadow-sm hover:shadow-md"
        >
          <Home className="w-4 h-4" />
          Exit Focus Mode
        </NavLink>

        <div className="flex items-center gap-2 bg-[var(--bg-surface)] px-4 py-2 rounded-full border border-[var(--border-hairline)] shadow-sm">
          <Activity className="w-4 h-4 text-[var(--accent)] animate-pulse" />
          <span className="text-xs font-mono font-medium text-[var(--text-secondary)]">
            Total Session: {formatTime(sessionSeconds)}
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 mt-8 lg:mt-0 z-10 max-w-7xl mx-auto w-full">
        {/* Left Side: Clock / Timer */}
        <div className="flex flex-col items-center flex-1 w-full">
          {/* Mode Toggle */}
          <div className="flex bg-[var(--bg-surface-raised)] border-2 border-[var(--border-brutal)] rounded-xl p-1 mb-10 shadow-sm brutal-border">
            <button
              onClick={() => {
                setMode("stopwatch");
                if (isActive) stopSession();
              }}
              className={`px-6 py-2 rounded-lg font-black uppercase tracking-wider text-sm transition-colors ${
                mode === "stopwatch"
                  ? "bg-[var(--text-primary)] text-[var(--bg-base)]"
                  : "text-[var(--text-primary)]/50 hover:text-[var(--text-primary)]"
              }`}
            >
              Live Clock
            </button>
            <button
              onClick={() => {
                setMode("pomodoro");
                if (isActive) stopSession();
              }}
              className={`px-6 py-2 rounded-lg font-black uppercase tracking-wider text-sm transition-colors ${
                mode === "pomodoro"
                  ? "bg-[var(--text-primary)] text-[var(--bg-base)]"
                  : "text-[var(--text-primary)]/50 hover:text-[var(--text-primary)]"
              }`}
            >
              Pomodoro
            </button>
          </div>

          {mode === "stopwatch" ? (
            <>
              <h2 className="text-sm font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-8 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Live Time
              </h2>
              <div className="flex items-center gap-2 md:gap-4 font-mono text-[12vw] lg:text-[8rem] font-bold leading-none tracking-tighter">
                <div className="bg-[var(--bg-surface-raised)] border-4 border-[var(--border-brutal)] rounded-2xl md:rounded-3xl p-4 md:p-8 brutal-shadow-lg relative overflow-hidden">
                  <span className="relative z-20 text-[var(--text-primary)]">
                    {hours}
                  </span>
                </div>
                <span className="text-[var(--text-primary)] font-black pb-4 animate-pulse">
                  :
                </span>
                <div className="bg-[var(--bg-surface-raised)] border-4 border-[var(--border-brutal)] rounded-2xl md:rounded-3xl p-4 md:p-8 brutal-shadow-lg relative overflow-hidden">
                  <span className="relative z-20 text-[var(--text-primary)]">
                    {minutes}
                  </span>
                </div>
                <span className="text-[var(--text-primary)] font-black pb-4 animate-pulse">
                  :
                </span>
                <div className="bg-[#a8e6cf] border-4 border-[var(--border-brutal)] rounded-2xl md:rounded-3xl p-4 md:p-8 brutal-shadow-lg relative overflow-hidden w-[100px] md:w-[160px] flex justify-center">
                  <span className="relative z-20 text-[var(--text-primary)]">
                    {seconds}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-8">
                <Settings2 className="w-5 h-5 text-[var(--text-primary)]/50" />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={pomodoroDuration}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setPomodoroDuration(val);
                      if (!isActive) setPomodoroLeft(val * 60);
                    }}
                    disabled={isActive}
                    className="w-16 bg-[var(--bg-surface-raised)] border-2 border-[var(--border-brutal)] rounded-lg px-2 py-1 text-center font-black outline-none disabled:opacity-50 brutal-border"
                  />
                  <span className="text-sm font-black uppercase text-[var(--text-primary)]/70">
                    Minutes
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-4 font-mono text-[12vw] lg:text-[10rem] font-bold leading-none tracking-tighter">
                <div className="bg-[var(--bg-surface-raised)] border-4 border-[var(--border-brutal)] rounded-2xl md:rounded-3xl p-4 md:p-10 brutal-shadow-lg relative overflow-hidden w-[140px] md:w-[220px] flex justify-center">
                  <span className="relative z-20 text-[var(--text-primary)]">
                    {pMins}
                  </span>
                </div>
                <span className="text-[var(--text-primary)] font-black pb-4 animate-pulse">
                  :
                </span>
                <div className="bg-[#ff6b6b] border-4 border-[var(--border-brutal)] rounded-2xl md:rounded-3xl p-4 md:p-10 brutal-shadow-lg relative overflow-hidden w-[140px] md:w-[220px] flex justify-center">
                  <span className="relative z-20 text-[var(--text-primary)]">
                    {pSecs}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Controls */}
          <div className="mt-12 flex gap-4">
            {!isActive ? (
              <button
                onClick={startSession}
                className="brutal-btn bg-[#2ed573] text-black px-8 py-4 rounded-xl font-black uppercase tracking-wider flex items-center gap-2 text-lg hover:-translate-y-1 hover:brutal-shadow-lg transition-all"
              >
                <Play className="w-6 h-6 fill-black" />
                Start Focus
              </button>
            ) : (
              <button
                onClick={pauseSession}
                className="brutal-btn bg-[#ffeb3b] text-black px-8 py-4 rounded-xl font-black uppercase tracking-wider flex items-center gap-2 text-lg hover:-translate-y-1 hover:brutal-shadow-lg transition-all"
              >
                <Pause className="w-6 h-6 fill-black" />
                Pause
              </button>
            )}

            <button
              onClick={stopSession}
              disabled={sessionSeconds === 0}
              className="brutal-btn bg-[#ff6b6b] text-black px-8 py-4 rounded-xl font-black uppercase tracking-wider flex items-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 hover:brutal-shadow-lg transition-all"
            >
              <Square className="w-6 h-6 fill-black" />
              End & Save
            </button>
          </div>

          {currentRoutine && mode === "stopwatch" && (
            <div className="mt-12 text-center animate-in slide-in-from-bottom-4 fade-in duration-700">
              <p className="text-xs font-mono uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
                Current Active Routine
              </p>
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-[#ffeb3b] text-black rounded-xl brutal-border shadow-sm">
                <span className="font-mono font-black text-lg">
                  {currentRoutine.time_label}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-primary)]" />
                <span className="font-bold text-lg tracking-tight">
                  {currentRoutine.title}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Task Board */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6 bg-[var(--bg-surface-raised)] p-6 rounded-2xl border-4 border-[var(--border-brutal)] brutal-shadow-lg h-[80vh]">
          <div className="flex items-center justify-between border-b-4 border-[var(--border-brutal)] pb-4">
            <h3 className="text-xl font-black uppercase flex items-center gap-2 text-[var(--text-primary)]">
              <Check className="w-6 h-6 text-[#2ed573] stroke-[4px]" /> Action
              Items
            </h3>
            <span className="text-xs font-black font-mono text-black bg-[#ffeb3b] px-3 py-1 rounded-md border-2 border-[var(--border-brutal)]">
              {tasks.filter((t) => t.status === "done").length +
                personalTodos.filter((t) => t.status === "done").length}{" "}
              / {tasks.length + personalTodos.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {tasks.length === 0 && personalTodos.length === 0 && (
              <div className="text-center py-12 text-[var(--text-primary)]/50 font-bold text-sm">
                No tasks scheduled for today. You're all clear!
              </div>
            )}

            {tasks.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-black font-mono uppercase tracking-widest text-[var(--text-primary)]/50 mb-2 pl-1">
                  Macro Tasks
                </div>
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(task.id, task.status)}
                    className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${
                      task.status === "done"
                        ? "bg-[#2ed573]/20 border-[#2ed573] opacity-60"
                        : "bg-[#fdfbf7] border-[var(--border-brutal)] hover:bg-[#ffeb3b] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:brutal-shadow"
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors flex-shrink-0 ${
                        task.status === "done"
                          ? "bg-[#2ed573] border-[var(--border-brutal)] text-black"
                          : "border-[var(--border-brutal)] bg-[var(--bg-surface-raised)]"
                      }`}
                    >
                      {task.status === "done" && (
                        <Check className="w-4 h-4" strokeWidth={4} />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p
                        className={`text-sm font-black uppercase ${task.status === "done" ? "line-through text-[var(--text-primary)]/50" : "text-[var(--text-primary)]"}`}
                      >
                        {task.title}
                      </p>
                      {task.category && (
                        <p className="text-[10px] font-black font-mono uppercase tracking-wider text-[var(--text-primary)]/50 mt-1">
                          {task.category}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {personalTodos.length > 0 && (
              <div className="space-y-3 pt-4">
                <div className="text-xs font-black font-mono uppercase tracking-widest text-[var(--text-primary)]/50 mb-2 pl-1">
                  Personal Todos
                </div>
                {personalTodos.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => toggleTodo(task.id, task.status)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      task.status === "done"
                        ? "bg-[#2ed573]/20 border-[#2ed573] opacity-60"
                        : "bg-[#fdfbf7] border-[var(--border-brutal)] hover:bg-[#a8e6cf] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:brutal-shadow"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 flex-shrink-0 rounded-md flex items-center justify-center border-2 transition-colors ${
                        task.status === "done"
                          ? "bg-[#2ed573] border-[var(--border-brutal)] text-black"
                          : "border-[var(--border-brutal)] bg-[var(--bg-surface-raised)]"
                      }`}
                    >
                      {task.status === "done" && (
                        <Check className="w-4 h-4" strokeWidth={4} />
                      )}
                    </div>
                    <p
                      className={`text-sm font-black uppercase text-left ${task.status === "done" ? "line-through text-[var(--text-primary)]/50" : "text-[var(--text-primary)]"}`}
                    >
                      {task.title}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
