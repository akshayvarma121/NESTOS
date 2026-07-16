import { useEffect, useState } from "react";
import { usePomodoro } from "../contexts/PomodoroContext";
import FlipClock from "../components/FlipClock";
import { Play, Pause, RotateCcw, SkipForward, Home, ListTodo, Settings, Check, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { api } from "../lib/api";
import ExpandableDescription from "../components/ExpandableDescription";
import { getLocalDateString, getLocalDayName } from "../lib/dateUtils";

export default function PomodoroPage() {
  const {
    timeRemaining,
    phase,
    isRunning,
    workDuration,
    setWorkDuration,
    startTimer,
    pauseTimer,
    resetTimer,
    skipPhase,
  } = usePomodoro();

  const [tasks, setTasks] = useState<any[]>([]);
  const [personalTodos, setPersonalTodos] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const [currentRoutine, setCurrentRoutine] = useState<any | null>(null);

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
        
        // Only get active tasks for today (including pending or done, not skipped)
        const activeTasks = (taskData || []).filter(
          (t: any) => t.status !== "skipped" && t.scheduled_date === todayStr
        );
        
        setTasks(activeTasks);
        setPersonalTodos(personalData || []);
        setRoutines(routinesData || []);
      } catch (err) {
        console.error("Failed to load tasks", err);
      }
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      
      if (routines.length > 0) {
        const sortedRoutines = [...routines].sort((a, b) => (a.time_label || "24:00").localeCompare(b.time_label || "24:00"));
        let latestActive = null;
        for (let i = 0; i < sortedRoutines.length; i++) {
          const t = sortedRoutines[i].time_label || "";
          if (t === "") continue;
          const start = t.split("-")[0].trim();
          if (start <= timeStr) {
            latestActive = sortedRoutines[i];
          }
        }
        
        if (latestActive) {
          const parts = (latestActive.time_label || "").split("-").map((s: string) => s.trim());
          const end = parts[1];
          if (end && timeStr >= end) {
            setCurrentRoutine(null);
          } else {
            setCurrentRoutine(latestActive);
          }
        } else {
          setCurrentRoutine(null);
        }
      }
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [routines]);

  const updateTaskStatus = async (id: string, newStatus: string) => {
    if (newStatus === "skipped") {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } else {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
    }
    await api.patch(`/micro-tasks/${id}`, { status: newStatus });
  };

  const togglePersonalTodo = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "pending" : "done";
    setPersonalTodos((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
    await api.patch(`/personal-todos/${id}`, { status: newStatus });
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-mono relative overflow-hidden">
      
      {/* Minimal Navigation */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
        <div className="flex gap-4">
          <NavLink to="/focus" className="p-2 text-gray-500 hover:text-white transition-colors">
            <Home className="w-5 h-5" />
          </NavLink>
          <NavLink to="/backlog" className="p-2 text-gray-500 hover:text-white transition-colors">
            <ListTodo className="w-5 h-5" />
          </NavLink>
        </div>
        <NavLink to="/settings" className="p-2 text-gray-500 hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
        </NavLink>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Main Timer Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-0">
          
          <div className="mb-8 flex flex-col items-center gap-3">
            <span className={`px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase border ${
              phase === "work" ? "border-red-500/50 text-red-500 bg-red-500/10" : "border-emerald-500/50 text-emerald-500 bg-emerald-500/10"
            }`}>
              {phase === "work" ? "Focus Session" : "Short Break"}
            </span>
            {currentRoutine && (
              <span className="text-sm text-gray-400 font-mono">
                Current: <strong className="text-gray-300">{currentRoutine.title}</strong>
              </span>
            )}
          </div>

          <FlipClock timeRemaining={timeRemaining} />

          {/* Controls */}
          <div className="mt-12 flex items-center gap-6">
            <button
              onClick={resetTimer}
              className="p-3 rounded-full text-gray-500 hover:text-white hover:bg-[#1a1a1a] transition-all"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
            
            <button
              onClick={isRunning ? pauseTimer : startTimer}
              className="p-6 rounded-full bg-white text-black hover:scale-105 transition-transform"
            >
              {isRunning ? <Pause className="w-8 h-8 fill-black" /> : <Play className="w-8 h-8 fill-black translate-x-0.5" />}
            </button>

            <button
              onClick={skipPhase}
              className="p-3 rounded-full text-gray-500 hover:text-white hover:bg-[#1a1a1a] transition-all"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>

          {/* Settings Slider (Only visible if not running and in work phase) */}
          {!isRunning && phase === "work" && (
            <div className="absolute bottom-12 flex flex-col items-center gap-2 text-gray-500 animate-in fade-in slide-in-from-bottom-4">
              <span className="text-xs tracking-widest uppercase">Session Length: {workDuration} min</span>
              <input 
                type="range" 
                min="25" 
                max="60" 
                step="5"
                value={workDuration}
                onChange={(e) => setWorkDuration(Number(e.target.value))}
                className="w-48 accent-white"
              />
            </div>
          )}
        </div>

        {/* Tasks Pane */}
        <div className="w-full lg:w-[400px] border-t lg:border-t-0 lg:border-l border-[#1a1a1a] bg-[#0a0a0a] p-6 lg:p-8 overflow-y-auto max-h-[40vh] lg:max-h-screen">
          <h2 className="text-gray-400 text-xs uppercase tracking-widest mb-6">Today's Horizon</h2>
          
          <div className="space-y-6">
            {/* Horizon Tasks */}
            {tasks.length > 0 && (
              <div className="space-y-3">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-start gap-3 group">
                    <button
                      onClick={() => updateTaskStatus(task.id, task.status === "done" ? "pending" : "done")}
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 rounded-[4px] border flex items-center justify-center transition-colors ${
                        task.status === "done" ? "bg-gray-600 border-gray-600" : "border-gray-600 hover:border-white"
                      }`}
                    >
                      {task.status === "done" && <Check className="w-3.5 h-3.5 text-black" />}
                    </button>
                    <div className={`flex-1 flex flex-col ${task.status === "done" ? "text-gray-600 line-through" : "text-gray-300"}`}>
                      <span className="text-sm leading-relaxed">
                        {task.title}
                      </span>
                      {task.description && (
                        <div className="mt-0.5 pr-2">
                          <ExpandableDescription text={task.description} />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => updateTaskStatus(task.id, "skipped")}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                      title="Skip Task"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Personal Focus */}
            {personalTodos.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-[#1a1a1a]">
                <h3 className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">Private List</h3>
                {personalTodos.map(todo => (
                  <div key={todo.id} className="flex items-start gap-3 group">
                    <button
                      onClick={() => togglePersonalTodo(todo.id, todo.status)}
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 rounded-[4px] border flex items-center justify-center transition-colors ${
                        todo.status === "done" ? "bg-gray-600 border-gray-600" : "border-gray-600 hover:border-white"
                      }`}
                    >
                      {todo.status === "done" && <Check className="w-3.5 h-3.5 text-black" />}
                    </button>
                    <span className={`text-sm leading-relaxed ${todo.status === "done" ? "text-gray-600 line-through" : "text-gray-300"}`}>
                      {todo.title}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {tasks.length === 0 && personalTodos.length === 0 && (
              <div className="text-gray-600 text-sm italic">
                No tasks scheduled for today. Just pure focus.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
