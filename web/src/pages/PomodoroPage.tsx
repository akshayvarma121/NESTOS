import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { api } from "../lib/api";
import { Clock, Home, Activity, Check, X } from "lucide-react";
import { getLocalDateString, getLocalDayName } from "../lib/dateUtils";

export default function FocusClockPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [personalTodos, setPersonalTodos] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const [currentRoutine, setCurrentRoutine] = useState<any | null>(null);

  // Live clock state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [sessionSeconds, setSessionSeconds] = useState(0);

  useEffect(() => {
    // Fetch focus tasks, personal todos, and routines
    const fetchTasks = async () => {
      try {
        const todayStr = getLocalDateString();
        const [taskData, personalData, routinesData] = await Promise.all([
          api.get(`/scheduler/focus?date=${todayStr}`),
          api.get("/personal-todos"),
          api.get(`/routines/day?day=${getLocalDayName()}&date=${todayStr}`)
        ]);
        
        // Only get active tasks for today
        const activeTasks = (taskData || []).filter(
          (t: any) => t.status !== "skipped" && t.scheduled_date === todayStr
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

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setSessionSeconds(s => s + 1);
      
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      
      if (routines.length > 0) {
        const sortedRoutines = [...routines].sort((a, b) => (a.time_label || "24:00").localeCompare(b.time_label || "24:00"));
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
    return () => clearInterval(timer);
  }, [routines]);

  const toggleTask = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "pending" : "done";
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    await api.patch(`/micro-tasks/${id}`, { status: newStatus });
  };

  const toggleTodo = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "pending" : "done";
    setPersonalTodos(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    await api.patch(`/personal-todos/${id}`, { status: newStatus });
  };

  const formatSessionTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const timeString = currentTime.toLocaleTimeString("en-US", { hour12: false });
  const [hours, minutes, seconds] = timeString.split(":");

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col p-4 md:p-8 animate-in fade-in duration-500 relative overflow-hidden">
      
      {/* Background ambient gradient */}
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
            Session: {formatSessionTime(sessionSeconds)}
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 mt-8 lg:mt-0 z-10 max-w-7xl mx-auto w-full">
        
        {/* Left Side: Live Flip Clock */}
        <div className="flex flex-col items-center flex-1 w-full">
          <h2 className="text-sm font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-8 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Live Time
          </h2>
          
          <div className="flex items-center gap-2 md:gap-4 font-mono text-[12vw] lg:text-[8rem] font-bold leading-none tracking-tighter">
            <div className="bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 top-1/2 h-px bg-[var(--border-hairline)] shadow-sm z-10" />
              <span className="relative z-20 text-[var(--text-primary)] drop-shadow-lg">{hours}</span>
            </div>
            <span className="text-[var(--text-tertiary)] pb-4 animate-pulse">:</span>
            <div className="bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 top-1/2 h-px bg-[var(--border-hairline)] shadow-sm z-10" />
              <span className="relative z-20 text-[var(--text-primary)] drop-shadow-lg">{minutes}</span>
            </div>
            <span className="text-[var(--text-tertiary)] pb-4 animate-pulse">:</span>
            <div className="bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-2xl relative overflow-hidden w-[100px] md:w-[160px] flex justify-center">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 top-1/2 h-px bg-[var(--border-hairline)] shadow-sm z-10" />
              <span className="relative z-20 text-[var(--accent)] drop-shadow-lg">{seconds}</span>
            </div>
          </div>

          {currentRoutine && (
            <div className="mt-16 text-center animate-in slide-in-from-bottom-4 fade-in duration-700">
              <p className="text-xs font-mono uppercase tracking-widest text-[var(--text-tertiary)] mb-3">Current Active Routine</p>
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-[var(--accent)]/10 text-[var(--accent)] rounded-2xl border border-[var(--accent)]/20 shadow-[0_0_40px_-10px_var(--accent)]">
                <span className="font-mono font-bold text-lg">{currentRoutine.time_label}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                <span className="font-medium text-lg tracking-tight">{currentRoutine.title}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Task Board */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6 bg-[var(--bg-surface)]/80 backdrop-blur-md p-6 rounded-3xl border border-[var(--border-hairline)] shadow-xl">
          
          <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Check className="w-5 h-5 text-[var(--accent)]" /> Action Items
            </h3>
            <span className="text-xs font-mono text-[var(--text-tertiary)] bg-[var(--bg-base)] px-2 py-1 rounded-md border border-[var(--border-hairline)]">
              {tasks.filter(t => t.status === "done").length + personalTodos.filter(t => t.status === "done").length} / {tasks.length + personalTodos.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[50vh] pr-2 space-y-4 custom-scrollbar">
            
            {tasks.length === 0 && personalTodos.length === 0 && (
              <div className="text-center py-12 text-[var(--text-tertiary)] text-sm">
                No tasks scheduled for today. You're all clear!
              </div>
            )}

            {tasks.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-mono uppercase tracking-widest text-[var(--text-tertiary)] mb-2 pl-1">Macro Tasks</div>
                {tasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(task.id, task.status)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all ${
                      task.status === "done" 
                        ? "bg-[var(--accent)]/5 border-[var(--accent)]/20 opacity-60" 
                        : "bg-[var(--bg-base)] border-[var(--border-hairline)] hover:border-[var(--accent)]/50 hover:shadow-md"
                    }`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                      task.status === "done"
                        ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                        : "border-[var(--text-tertiary)]"
                    }`}>
                      {task.status === "done" && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-medium ${task.status === "done" ? "line-through text-[var(--text-secondary)]" : "text-[var(--text-primary)]"}`}>
                        {task.title}
                      </p>
                      {task.category && (
                        <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mt-1">
                          {task.category}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {personalTodos.length > 0 && (
              <div className="space-y-2 pt-4">
                <div className="text-xs font-mono uppercase tracking-widest text-[var(--text-tertiary)] mb-2 pl-1">Personal Todos</div>
                {personalTodos.map(task => (
                  <button
                    key={task.id}
                    onClick={() => toggleTodo(task.id, task.status)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      task.status === "done" 
                        ? "bg-blue-500/5 border-blue-500/20 opacity-60" 
                        : "bg-[var(--bg-base)] border-[var(--border-hairline)] hover:border-blue-500/50 hover:shadow-md"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                      task.status === "done"
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "border-[var(--text-tertiary)]"
                    }`}>
                      {task.status === "done" && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                    </div>
                    <p className={`text-sm font-medium ${task.status === "done" ? "line-through text-[var(--text-secondary)]" : "text-[var(--text-primary)]"}`}>
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
