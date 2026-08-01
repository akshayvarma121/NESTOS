import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Check, Info, X, Calendar as CalendarIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import EditTimetablePanel, {
  calculateDuration,
} from "../components/EditTimetablePanel";
import CountdownTimer from "../components/CountdownTimer";
import ExpandableDescription from "../components/ExpandableDescription";
import BrutalistCalendar from "../components/BrutalistCalendar";
import {
  getLocalDateString,
  getLocalDayName,
  getLogicalDate,
} from "../lib/dateUtils";
import { useAuth } from "../contexts/AuthContext";

const categoryColors: Record<string, string> = {
  academic: "bg-[var(--accent)]",
  dsa: "bg-[var(--warning)]",
  dev: "bg-[var(--success)]",
  other: "bg-[var(--text-secondary)]",
};

function InlineEdit({
  initialValue,
  onSave,
  disabled,
}: {
  initialValue: string;
  onSave: (val: string) => void;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(initialValue);

  if (editing) {
    return (
      <input
        autoFocus
        className="bg-transparent border-b border-[var(--accent)] outline-none text-[var(--text-primary)] w-full py-1"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (val !== initialValue) onSave(val);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
    );
  }
  return (
    <span
      className={`py-1 block w-full ${disabled ? "opacity-75" : "cursor-text hover:text-[var(--text-primary)] transition-colors"}`}
      onClick={() => {
        if (!disabled) setEditing(true);
      }}
    >
      {initialValue}
    </span>
  );
}

export default function FocusPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const [partnerRoutines, setPartnerRoutines] = useState<any[]>([]);
  const [personalTodos, setPersonalTodos] = useState<any[]>([]);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [dashboardNotes, setDashboardNotes] = useState<any[]>([]);
  const [spaceMembers, setSpaceMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasGoals, setHasGoals] = useState<boolean | null>(null);
  const [isTimetableOpen, setIsTimetableOpen] = useState(false);
  const [isRoutineLocked, setIsRoutineLocked] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [closeouts, setCloseouts] = useState<any[]>([]);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  const [selectedDateStr, setSelectedDateStr] = useState(getLocalDateString());
  const [actualTodayStr, setActualTodayStr] = useState(getLocalDateString());

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
      );
      const newDateStr = getLocalDateString(now);
      setActualTodayStr((prev) => {
        if (prev !== newDateStr) {
          setSelectedDateStr((curr) => (curr === prev ? newDateStr : curr));
          return newDateStr;
        }
        return prev;
      });
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Clear tasks immediately to prevent flicker while fetching new date
    setTasks([]);
    setRoutines([]);
    setPartnerRoutines([]);
    fetchFocusData();
    // Fetch once on mount or when selectedDateStr/currentCalendarDate changes
  }, [selectedDateStr, currentCalendarDate]);

  const fetchFocusData = async () => {
    setLoading(true);
    try {
      await api.post("/scheduler/recompute", { date: actualTodayStr });

      const [
        taskData,
        membersData,
        routinesData,
        personalData,
        deadlinesData,
        notesData,
        lockData,
        calendarData,
      ] = await Promise.all([
        api.get(`/scheduler/focus?date=${selectedDateStr}`),
        api.get("/partner/space"),
        api.get(
          `/routines/day?day=${getLocalDayName(new Date(selectedDateStr + "T12:00:00"))}&date=${selectedDateStr}`,
        ),
        api.get("/personal-todos"),
        api.get("/deadlines"),
        api.get("/notes"),
        api.get(`/routines/day/lock-status?date=${selectedDateStr}`),
        api.get("/calendar"),
      ]);

      setTasks(taskData);
      setSpaceMembers(membersData);
      setRoutines(routinesData?.myRoutines || []);
      setPartnerRoutines(routinesData?.partnerRoutines || []);
      setPersonalTodos(personalData || []);
      setDeadlines(deadlinesData || []);
      setDashboardNotes(
        (notesData || []).filter((n: any) => n.type === "dashboard"),
      );
      setIsRoutineLocked(lockData?.isLocked || false);
      setEvents(calendarData?.events || []);
      setCloseouts(calendarData?.closeouts || []);

      if (taskData.length === 0) {
        const goalsData = await api.get("/macro-goals");
        setHasGoals(goalsData.length > 0);
      } else {
        setHasGoals(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (id: string, newStatus: string) => {
    if (newStatus === "skipped") {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } else {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)),
      );
    }
    await api.patch(`/micro-tasks/${id}`, { status: newStatus });
  };

  const moveToBacklog = async (id: string) => {
    // Remove from FocusPage UI by filtering it out
    setTasks((prev) => prev.filter((t) => t.id !== id));
    // Patch backend to clear scheduled_date and reset status to pending
    await api.patch(`/micro-tasks/${id}`, {
      status: "pending",
      scheduled_date: null,
    });
  };

  const renameTask = async (id: string, newTitle: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: newTitle } : t)),
    );
    await api.patch(`/micro-tasks/${id}`, { title: newTitle });
  };

  const changeAssignee = async (id: string, assignee_id: string | null) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const member = spaceMembers.find((m) => m.user_id === assignee_id);
          return {
            ...t,
            assigned_to: assignee_id,
            assignee: member ? { username: member.username } : null,
          };
        }
        return t;
      }),
    );
    await api.patch(`/micro-tasks/${id}`, { assigned_to: assignee_id });
  };

  const togglePersonalTodo = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "pending" : "done";
    setPersonalTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)),
    );
    await api.patch(`/personal-todos/${id}`, { status: newStatus });
  };

  const deletePersonalTodo = async (id: string) => {
    setPersonalTodos((prev) => prev.filter((t) => t.id !== id));
    await api.delete(`/personal-todos/${id}`);
  };

  const addPersonalTodo = async (title: string) => {
    if (!title.trim()) return;
    const tempId = `temp-${Date.now()}`;
    setPersonalTodos((prev) => [
      ...prev,
      { id: tempId, title, status: "pending" },
    ]);

    try {
      const data = await api.post("/personal-todos", { title });
      setPersonalTodos((prev) => prev.map((t) => (t.id === tempId ? data : t)));
    } catch (e) {
      setPersonalTodos((prev) => prev.filter((t) => t.id !== tempId));
    }
  };

  const activeDeadlines = deadlines
    .filter(
      (d) => d.deadline && d.deadline.split("T")[0] >= getLocalDateString(),
    )
    .slice(0, 3); // show up to 3 upcoming

  if (loading)
    return (
      <div className="p-6 text-[var(--text-secondary)]">
        Recalibrating Focus...
      </div>
    );

  // Active tasks mean they are not skipped
  const activeTasks = tasks.filter((t) => t.status !== "skipped");

  const todayTasks = activeTasks.filter(
    (t) => t.scheduled_date === selectedDateStr,
  );
  const upcomingTasks = activeTasks.filter(
    (t) =>
      t.scheduled_date !== selectedDateStr &&
      t.scheduled_date > selectedDateStr,
  );
  const overdueTasks = activeTasks.filter(
    (t) =>
      t.scheduled_date !== selectedDateStr &&
      t.scheduled_date < selectedDateStr &&
      t.status !== "done",
  );

  // Helper to group by subject
  const groupBySubject = (taskList: any[]) => {
    return taskList.reduce(
      (acc, task) => {
        const cat = task.category || task.macro?.category || "other";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(task);
        return acc;
      },
      {} as Record<string, any[]>,
    );
  };

  const todayGrouped = groupBySubject(todayTasks);
  const upcomingGrouped = groupBySubject(upcomingTasks);
  const overdueGrouped = groupBySubject(overdueTasks);

  const renderSubjectGroup = (groupedData: Record<string, any[]>) => {
    return Object.entries(groupedData).map(([category, catTasks]) => (
      <div key={category} className="space-y-2">
        <h3 className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-2 pl-3">
          {category}
        </h3>
        <div className="flex flex-col gap-1.5">
          {(catTasks as any[]).map((task: any) => (
            <div
              key={task.id}
              className="flex items-center gap-3 group relative pl-3"
            >
              <div
                className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-full ${categoryColors[category] || categoryColors.other}`}
              />

              <button
                disabled={isRoutineLocked}
                onClick={() =>
                  updateTaskStatus(
                    task.id,
                    task.status === "done" ? "pending" : "done",
                  )
                }
                className={`w-5 h-5 flex-shrink-0 rounded-[4px] border ${
                  task.status === "done"
                    ? "bg-[var(--text-tertiary)] border-[var(--text-tertiary)]"
                    : "border-[var(--border-hairline)] hover:border-[var(--text-secondary)]"
                } flex items-center justify-center transition-colors disabled:opacity-50`}
              >
                {task.status === "done" && (
                  <Check className="w-3.5 h-3.5 text-[var(--bg-base)]" />
                )}
              </button>

              <div
                className={`flex-1 flex flex-col ${task.status === "done" ? "text-[var(--text-tertiary)] line-through" : "text-[var(--text-secondary)]"}`}
              >
                <div className="text-sm">
                  <InlineEdit
                    initialValue={task.title}
                    onSave={(newVal) => renameTask(task.id, newVal)}
                    disabled={isRoutineLocked}
                  />
                </div>
                {task.description && (
                  <div className="-mt-0.5 mb-1 pr-4">
                    <ExpandableDescription text={task.description} />
                  </div>
                )}
              </div>

              <button
                disabled={isRoutineLocked}
                onClick={() => moveToBacklog(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-0"
                title="Move to Backlog"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Show date label if not today */}
              {task.scheduled_date !== selectedDateStr && (
                <span className="text-[10px] uppercase font-mono text-[var(--text-tertiary)] mr-2 bg-[var(--bg-surface-raised)] px-1.5 py-0.5 rounded border border-[var(--border-hairline)]">
                  {new Date(task.scheduled_date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}

              {/* Assignee Dropdown */}
              <select
                className={`text-xs bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] rounded px-1.5 py-0.5 outline-none hover:border-[var(--text-secondary)] transition-colors ${task.status === "done" ? "opacity-50 pointer-events-none" : ""}`}
                value={task.assigned_to || ""}
                onChange={(e) =>
                  changeAssignee(task.id, e.target.value || null)
                }
              >
                <option value="">Anyone</option>
                {spaceMembers.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.username}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    ));
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const firstName =
    user?.user_metadata?.name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "User";

  // Parse the selected date string (YYYY-MM-DD) carefully to avoid timezone shifts
  const [year, month, day] = selectedDateStr.split("-").map(Number);
  const displayDate = new Date(year, month - 1, day);

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto relative pb-32">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-block bg-[#ffeb3b] text-black border-2 border-black brutal-shadow-sm px-3 py-1 mb-4">
            <p className="text-xs font-black font-mono uppercase tracking-[0.2em]">
              {displayDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--text-primary)] mb-3 flex items-center gap-3">
            {getGreeting()}, {firstName}.
            <div className="relative group/info cursor-help inline-flex translate-y-1">
              <Info className="w-5 h-5 text-[var(--text-tertiary)] hover:text-[#ff6b6b] transition-colors" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-[var(--bg-surface-raised)] border-2 border-[var(--border-brutal)] rounded-lg brutal-shadow opacity-0 group-hover/info:opacity-100 pointer-events-none transition-opacity z-50 text-xs font-medium text-[var(--text-primary)] text-center">
                This page shows your daily tasks, timetable, and upcoming
                deadlines. Tasks are automatically pulled from your Goals or
                Backlog.
              </div>
            </div>
          </h1>
          <p className="text-[var(--text-secondary)] font-medium max-w-xl text-sm md:text-base border-l-4 border-[#ff6b6b] pl-3">
            Here is what you have going on today.
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="flex flex-col items-start md:items-end">
            <span className="text-[10px] font-black font-mono uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Active View
            </span>
            <span className="text-sm font-bold text-black bg-[#a8e6cf] px-2 py-0.5 mt-1 border-2 border-black brutal-shadow-sm rotate-[-2deg]">
              Dashboard
            </span>
          </div>
          <div className="w-px h-10 bg-[var(--border-hairline)] hidden md:block" />
          <button
            onClick={() => setIsTimetableOpen(true)}
            className="brutal-btn bg-[#2ed573] text-black px-6 py-3 text-sm font-black uppercase tracking-wider flex-shrink-0"
          >
            Timetable Editor
          </button>
        </div>
      </div>

      {tasks.length === 0 && routines.length === 0 && hasGoals === false ? (
        <div className="p-8 flex flex-col items-center justify-center h-full max-w-md mx-auto text-center space-y-4">
          <p className="text-[var(--text-secondary)]">
            No goals or routines yet.
          </p>
          <div className="flex gap-4">
            <NavLink
              to="/goals"
              className="bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] px-4 py-2 rounded-lg text-sm hover:bg-[var(--border-hairline)] transition-colors"
            >
              Go to Goals
            </NavLink>
            <button
              onClick={() => setIsTimetableOpen(true)}
              className="bg-[var(--accent)] text-[var(--bg-base)] px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Setup Timetable
            </button>
          </div>
          <EditTimetablePanel
            isOpen={isTimetableOpen}
            onClose={() => setIsTimetableOpen(false)}
            onUpdate={fetchFocusData}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
            {/* LEFT COLUMN: MAIN FOCUS */}
            <div className="space-y-8 min-w-0">
              <BrutalistCalendar
                currentDate={currentCalendarDate}
                selectedDateStr={selectedDateStr}
                events={events}
                closeouts={closeouts}
                onSelectDate={setSelectedDateStr}
                onMonthChange={setCurrentCalendarDate}
              />

              {/* SELECTED DATE EVENTS */}
              <div className="bg-[var(--bg-surface-raised)] border-t-4 border-[var(--border-brutal)] brutal-shadow-sm p-4 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)] border-b-2 border-[var(--border-brutal)] pb-2 flex justify-between">
                  <span>Events & Deadlines</span>
                  <span className="text-[var(--text-secondary)]">
                    {selectedDateStr}
                  </span>
                </h3>

                <div className="space-y-2">
                  {events
                    .filter((e) => e.date === selectedDateStr)
                    .map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between group text-sm font-bold text-[var(--text-primary)] p-2 hover:bg-[var(--bg-surface)] transition-colors rounded"
                      >
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#ff6b6b]" />
                          {event.title}
                        </span>
                        <button
                          onClick={async () => {
                            try {
                              await api.delete(`/calendar/events/${event.id}`);
                              setEvents((prev) =>
                                prev.filter((e) => e.id !== event.id),
                              );
                            } catch (err) {
                              console.error("Failed to delete event", err);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 text-[#ff6b6b] text-xs uppercase font-black hover:underline transition-all"
                        >
                          Del
                        </button>
                      </div>
                    ))}
                  {events.filter((e) => e.date === selectedDateStr).length ===
                    0 && (
                    <p className="text-xs italic text-[var(--text-secondary)] py-2 text-center">
                      No important dates scheduled.
                    </p>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Mark a new date... (Press Enter)"
                  className="w-full bg-[var(--bg-surface)] outline-none text-sm font-bold text-[var(--text-primary)] placeholder-[var(--text-tertiary)] p-3 border-2 border-[var(--border-brutal)] focus:border-[var(--accent)] transition-colors"
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      const title = e.currentTarget.value.trim();
                      e.currentTarget.value = "";
                      try {
                        const res = await api.post("/calendar/events", {
                          title,
                          date: selectedDateStr,
                        });
                        setEvents((prev) => [...prev, res.data]);
                      } catch (err) {
                        console.error("Failed to add event");
                      }
                    }
                  }}
                />
              </div>

              {/* DAILY ROUTINE TIMETABLE */}
              <section className="space-y-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] border-b-2 border-[var(--border-brutal)] pb-2 flex items-center justify-between">
                  <span>Daily Routine</span>
                  <div className="flex items-center gap-3">
                    <NavLink
                      to="/routines-history"
                      className="text-[10px] uppercase font-bold brutal-border bg-[var(--bg-surface-raised)] px-2 py-1 text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-base)] transition-colors"
                    >
                      Analytics
                    </NavLink>
                    <span className="text-xs font-mono font-bold text-[var(--text-primary)]/50">
                      Timeline
                    </span>
                  </div>
                </h2>
                {routines.length === 0 ? (
                  <div className="py-6 px-4 border border-dashed border-[var(--border-hairline)] rounded-xl flex flex-col items-center justify-center text-center space-y-3">
                    <p className="text-sm text-[var(--text-secondary)]">
                      No active routines scheduled for today.
                    </p>
                    <button
                      onClick={() => setIsTimetableOpen(true)}
                      className="text-xs bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] px-3 py-1.5 rounded-[4px] hover:border-[var(--text-secondary)] transition-colors"
                    >
                      Open Timetable Editor
                    </button>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 pt-2">
                    <div className="absolute left-[11px] top-4 bottom-4 w-[2px] bg-[var(--border-hairline)] rounded-full" />

                    {(() => {
                      const sortedRoutines = [...routines].sort((a, b) =>
                        (a.time_label || "24:00").localeCompare(
                          b.time_label || "24:00",
                        ),
                      );

                      let latestActiveIdx = -1;
                      for (let i = 0; i < sortedRoutines.length; i++) {
                        const t = sortedRoutines[i].time_label || "";
                        if (t === "") continue; // Anytime
                        const start = t.split("-")[0].trim();
                        if (start <= currentTimeStr) {
                          latestActiveIdx = i;
                        }
                      }

                      const categorized = sortedRoutines.map((routine, i) => {
                        const t = routine.time_label || "";
                        if (!t) return { routine, bucket: "anytime" };

                        const parts = t.split("-").map((s: string) => s.trim());
                        const start = parts[0];
                        const end = parts[1]; // might be undefined

                        if (currentTimeStr < start) {
                          return { routine, bucket: "future" };
                        }

                        if (end) {
                          if (currentTimeStr >= end)
                            return { routine, bucket: "past" };
                          return { routine, bucket: "current" };
                        } else {
                          // No end time. It is current if it's the latest active one.
                          if (i === latestActiveIdx)
                            return { routine, bucket: "current" };
                          return { routine, bucket: "past" };
                        }
                      });

                      const displayRoutines = [
                        ...categorized
                          .filter((c) => c.bucket === "current")
                          .map((c) => ({
                            ...c.routine,
                            isCurrent: true,
                            isPast: false,
                          })),
                        ...categorized
                          .filter((c) => c.bucket === "future")
                          .map((c) => ({
                            ...c.routine,
                            isCurrent: false,
                            isPast: false,
                          })),
                        ...categorized
                          .filter((c) => c.bucket === "anytime")
                          .map((c) => ({
                            ...c.routine,
                            isCurrent: false,
                            isPast: false,
                          })),
                        ...categorized
                          .filter((c) => c.bucket === "past")
                          .map((c) => ({
                            ...c.routine,
                            isCurrent: false,
                            isPast: true,
                          })),
                      ];

                      return displayRoutines.map((routine) => {
                        const isCurrent = routine.isCurrent;
                        const isPast = routine.isPast;

                        return (
                          <div key={routine.id} className="relative">
                            {/* Timeline Dot */}
                            <div
                              className={`absolute -left-[29px] top-4 w-3 h-3 border-2 z-10 transition-colors ${
                                isCurrent
                                  ? "bg-[#ff6b6b] border-[var(--border-brutal)] brutal-shadow-sm"
                                  : isPast
                                    ? "bg-[var(--text-primary)] border-[var(--border-brutal)]"
                                    : "bg-[var(--bg-surface-raised)] border-[var(--border-brutal)]"
                              }`}
                            />

                            <div
                              className={`flex flex-col p-4 border-l-4 border-[var(--border-brutal)] transition-colors ${
                                isCurrent
                                  ? "brutal-shadow-sm bg-[var(--bg-surface-raised)]"
                                  : routine.status !== "pending"
                                    ? "bg-[var(--text-primary)]/5 border-[var(--border-brutal)]/30"
                                    : "bg-[var(--bg-surface-raised)] hover:brutal-shadow-sm hover:translate-x-[-2px] hover:translate-y-[-2px]"
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className="flex flex-col gap-1.5 flex-shrink-0">
                                  {/* Done Button */}
                                  <button
                                    disabled={isRoutineLocked}
                                    onClick={async () => {
                                      const newStatus =
                                        routine.status === "done"
                                          ? "pending"
                                          : "done";
                                      setRoutines((prev) =>
                                        prev.map((r) =>
                                          r.id === routine.id
                                            ? {
                                                ...r,
                                                status: newStatus,
                                                note:
                                                  newStatus === "pending"
                                                    ? ""
                                                    : r.note,
                                              }
                                            : r,
                                        ),
                                      );
                                      try {
                                        await api.post(
                                          `/routines/${routine.id}/toggle`,
                                          {
                                            date: selectedDateStr,
                                            status: newStatus,
                                          },
                                        );
                                      } catch (e) {
                                        fetchFocusData();
                                      }
                                    }}
                                    className={`w-5 h-5 rounded-[4px] border flex items-center justify-center transition-colors ${
                                      routine.status === "done"
                                        ? "bg-[var(--accent)] border-[var(--accent)]"
                                        : "border-[var(--border-hairline)] hover:border-[var(--accent)] text-transparent hover:text-[var(--accent)]"
                                    } ${isRoutineLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                                    title="Mark as Done"
                                  >
                                    <Check
                                      className={`w-3.5 h-3.5 ${routine.status === "done" ? "text-[var(--bg-base)]" : "text-inherit"}`}
                                      strokeWidth={3}
                                    />
                                  </button>

                                  {/* Skipped Button */}
                                  <button
                                    disabled={isRoutineLocked}
                                    onClick={async () => {
                                      const newStatus =
                                        routine.status === "skipped"
                                          ? "pending"
                                          : "skipped";
                                      setRoutines((prev) =>
                                        prev.map((r) =>
                                          r.id === routine.id
                                            ? {
                                                ...r,
                                                status: newStatus,
                                                note:
                                                  newStatus === "pending"
                                                    ? ""
                                                    : r.note,
                                              }
                                            : r,
                                        ),
                                      );
                                      try {
                                        await api.post(
                                          `/routines/${routine.id}/toggle`,
                                          {
                                            date: selectedDateStr,
                                            status: newStatus,
                                          },
                                        );
                                      } catch (e) {
                                        fetchFocusData();
                                      }
                                    }}
                                    className={`w-5 h-5 rounded-[4px] border flex items-center justify-center transition-colors ${
                                      routine.status === "skipped"
                                        ? "bg-[var(--warning)] border-[var(--warning)]"
                                        : "border-[var(--border-hairline)] hover:border-[var(--warning)] text-transparent hover:text-[var(--warning)]"
                                    } ${isRoutineLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                                    title="Mark as Skipped/Failed"
                                  >
                                    <X
                                      className={`w-3 h-3 ${routine.status === "skipped" ? "text-[var(--bg-base)]" : "text-inherit"}`}
                                      strokeWidth={3}
                                    />
                                  </button>
                                </div>
                                <div className="flex-1 text-left">
                                  <div
                                    className={`text-base font-black flex items-center gap-2 ${
                                      routine.status === "done"
                                        ? "line-through text-[var(--text-tertiary)]"
                                        : routine.status === "skipped"
                                          ? "text-[#ff6b6b]"
                                          : "text-[var(--text-primary)]"
                                    }`}
                                  >
                                    {routine.title}
                                    {routine.description && (
                                      <div className="ml-1 mb-1 pr-4">
                                        <ExpandableDescription
                                          text={routine.description}
                                        />
                                      </div>
                                    )}
                                    {routine.assignee?.username && (
                                      <span className="text-[10px] font-black uppercase px-2 py-0.5 brutal-border bg-[#ffeb3b] text-black">
                                        {routine.assignee.username}
                                      </span>
                                    )}
                                    {isCurrent &&
                                      routine.status === "pending" && (
                                        <span className="text-[10px] font-black uppercase bg-[#ff6b6b] text-[var(--bg-base)] px-2 py-0.5 brutal-border border-white">
                                          Current
                                        </span>
                                      )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[11px] font-bold text-[var(--text-primary)]/60 uppercase">
                                      {routine.time_label || "Anytime"}
                                    </span>
                                    {calculateDuration(routine.time_label) && (
                                      <span className="text-[11px] font-black uppercase text-black bg-[#ffeb3b] border-2 border-black px-2 py-0.5 brutal-shadow-sm">
                                        {calculateDuration(routine.time_label)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {routine.status !== "pending" && (
                                <div className="pl-9 mt-2">
                                  <input
                                    type="text"
                                    disabled={isRoutineLocked}
                                    placeholder={
                                      routine.status === "skipped"
                                        ? "Why did you skip/miss this?"
                                        : "Add a note (optional)..."
                                    }
                                    className="w-full bg-transparent border-b border-[var(--border-hairline)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors py-1 disabled:opacity-50 disabled:border-transparent"
                                    defaultValue={routine.note || ""}
                                    onBlur={async (e) => {
                                      const val = e.target.value;
                                      if (val !== (routine.note || "")) {
                                        try {
                                          await api.patch(
                                            `/routines/${routine.id}/log`,
                                            {
                                              date: selectedDateStr,
                                              note: val,
                                            },
                                          );
                                          setRoutines((prev) =>
                                            prev.map((r) =>
                                              r.id === routine.id
                                                ? { ...r, note: val }
                                                : r,
                                            ),
                                          );
                                        } catch (err) {
                                          console.error(err);
                                        }
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.currentTarget.blur();
                                      }
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                    {!isRoutineLocked ? (
                      (() => {
                        const isLockTime =
                          currentTimeStr.startsWith("23:") ||
                          parseInt(currentTimeStr.split(":")[0]) < 4;
                        return (
                          <div className="pt-4 pl-6 relative">
                            <button
                              disabled={!isLockTime}
                              onClick={async () => {
                                if (
                                  !confirm(
                                    "Are you sure? You cannot edit today's routines after saving.",
                                  )
                                )
                                  return;
                                try {
                                  await api.post("/routines/day/lock", {
                                    date: selectedDateStr,
                                  });
                                  setIsRoutineLocked(true);
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className={`w-full py-2.5 text-xs font-medium uppercase tracking-wider rounded-xl transition-opacity ${
                                isLockTime
                                  ? "bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90"
                                  : "bg-[var(--bg-surface-raised)] border border-dashed border-[var(--border-hairline)] text-[var(--text-tertiary)] cursor-not-allowed"
                              }`}
                            >
                              {isLockTime
                                ? "Save & Lock Timeline"
                                : "Available at 23:00 to Lock"}
                            </button>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="pt-4 pl-6 relative">
                        <div className="w-full py-2.5 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] text-center border border-dashed border-[var(--border-hairline)] rounded-xl">
                          Timeline Locked for Today
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {partnerRoutines.length > 0 && (
                <section className="space-y-4 pt-8 border-t border-[var(--border-hairline)]">
                  <h2 className="text-sm font-medium border-b border-[var(--border-hairline)] pb-2 flex items-center justify-between text-[var(--text-secondary)]">
                    <span>Partner's Timeline</span>
                  </h2>
                  <div className="relative border-l-2 border-[var(--border-hairline)] ml-3 space-y-8">
                    {partnerRoutines.map((routine, idx) => (
                      <div key={routine.id} className="relative pl-6">
                        <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[var(--border-hairline)] ring-4 ring-[var(--bg-base)]" />
                        <div className="flex items-start gap-4">
                          <div className="w-[80px] shrink-0 pt-0.5">
                            <div className="text-xs font-mono font-medium text-[var(--text-secondary)]">
                              {routine.time_label}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-[var(--text-primary)]">
                              {routine.title}
                            </div>
                            <div className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-1">
                              Status:{" "}
                              {routine.status === "done"
                                ? "Completed"
                                : routine.status === "skipped"
                                  ? "Skipped"
                                  : "Pending"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* RIGHT COLUMN: SIDEBAR */}
            <div className="space-y-6 min-w-0">
              <div className="bg-[var(--bg-surface-raised)] border-t-4 border-[var(--border-brutal)] brutal-shadow p-6">
                <h2 className="text-sm font-black uppercase tracking-widest border-b-2 border-[var(--border-brutal)] pb-3 mb-6 flex items-center justify-between text-[var(--text-primary)]">
                  <span>
                    {selectedDateStr === actualTodayStr
                      ? "Today's Horizon"
                      : "Focus Horizon"}
                  </span>
                  <span className="text-[10px] font-bold bg-[#ffeb3b] brutal-border px-2 py-0.5">
                    {todayTasks.length} tasks
                  </span>
                </h2>
                {todayTasks.length === 0 ? (
                  <p className="text-sm font-bold text-[var(--text-primary)]/60 italic">
                    Nothing scheduled for this date.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {renderSubjectGroup(todayGrouped)}
                  </div>
                )}
              </div>

              {/* OVERDUE */}
              {overdueTasks.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-sm font-black uppercase tracking-widest text-[#ff6b6b] border-b-2 border-[#ff6b6b] pb-2">
                    Overdue Action Items
                  </h2>
                  <div className="p-4 bg-[var(--bg-surface-raised)] brutal-border brutal-shadow-sm space-y-4">
                    {renderSubjectGroup(overdueGrouped)}
                  </div>
                </section>
              )}

              {/* UPCOMING */}
              {upcomingTasks.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]/70 border-b-2 border-[var(--border-brutal)] pb-2 flex items-center justify-between">
                    <span>Upcoming Horizon</span>
                    <span className="text-xs font-mono text-[var(--text-primary)]/50">
                      {upcomingTasks.length} tasks
                    </span>
                  </h2>
                  <div className="space-y-6">
                    {renderSubjectGroup(upcomingGrouped)}
                  </div>
                </section>
              )}

              {/* PRIVATE FOCUS */}
              <section className="space-y-4 pt-4">
                <h2 className="text-sm font-black uppercase tracking-widest border-b-2 border-[var(--border-brutal)] pb-2 flex items-center justify-between text-[var(--text-primary)]">
                  <span className="flex items-center gap-2">
                    Private Focus{" "}
                    <span className="text-[10px] bg-[var(--text-primary)] text-[var(--bg-base)] px-2 py-0.5 brutal-border border-transparent uppercase font-bold">
                      Only You
                    </span>
                  </span>
                </h2>
                <div className="space-y-3 bg-[var(--bg-surface-raised)] brutal-border brutal-shadow-sm p-4">
                  {personalTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-center gap-3 group"
                    >
                      <button
                        onClick={() => togglePersonalTodo(todo.id, todo.status)}
                        className={`w-6 h-6 rounded-md flex items-center justify-center border-2 border-[var(--border-brutal)] flex-shrink-0 transition-colors ${
                          todo.status === "done"
                            ? "bg-[#2ed573] text-black"
                            : "bg-[var(--bg-surface-raised)]"
                        }`}
                      >
                        {todo.status === "done" && (
                          <Check className="w-4 h-4 text-[var(--bg-base)]" />
                        )}
                      </button>
                      <div
                        className={`flex-1 text-sm font-bold ${todo.status === "done" ? "text-[var(--text-tertiary)] line-through" : "text-[var(--text-primary)]"}`}
                      >
                        {todo.title}
                      </div>
                      <button
                        onClick={() => deletePersonalTodo(todo.id)}
                        className="opacity-0 group-hover:opacity-100 text-[#ff6b6b] text-xs font-bold uppercase transition-all"
                      >
                        Del
                      </button>
                    </div>
                  ))}
                  <input
                    type="text"
                    placeholder="Add a private to-do... (Press Enter)"
                    className="w-full bg-transparent outline-none text-sm font-bold text-[var(--text-primary)] placeholder-[var(--text-tertiary)] pt-3 border-t-2 border-[var(--border-brutal)] mt-3"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addPersonalTodo(e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </div>
              </section>

              {/* STICKY NOTES */}
              {dashboardNotes.length > 0 && (
                <section className="grid grid-cols-2 gap-4">
                  {dashboardNotes.map((note) => {
                    const colorClass =
                      note.color === "yellow"
                        ? "bg-[#ffeb3b]"
                        : note.color === "pink"
                          ? "bg-[#ffb6c1]"
                          : note.color === "blue"
                            ? "bg-[#a8e6cf]"
                            : "bg-[#2ed573]";

                    return (
                      <div
                        key={note.id}
                        className={`p-4 brutal-border brutal-shadow-sm flex flex-col gap-2 min-h-[100px] transform -rotate-1 hover:rotate-0 transition-transform ${colorClass}`}
                      >
                        <div className="flex items-center justify-between opacity-70">
                          <span className="text-[10px] font-black uppercase">
                            Sticky
                          </span>
                          <span className="text-[10px] font-bold">
                            {note.creator?.username || "You"}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-[var(--text-primary)] whitespace-pre-wrap">
                          {note.content}
                        </p>
                      </div>
                    );
                  })}
                </section>
              )}
            </div>
          </div>
        </>
      )}

      <EditTimetablePanel
        isOpen={isTimetableOpen}
        onClose={() => setIsTimetableOpen(false)}
        onUpdate={fetchFocusData}
      />
    </div>
  );
}
