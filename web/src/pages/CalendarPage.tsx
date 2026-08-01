import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { getLogicalDate } from "../lib/dateUtils";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Flag,
  AlertCircle,
  RefreshCw
} from "lucide-react";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(getLogicalDate());
  const [loading, setLoading] = useState(true);

  // Data
  const [events, setEvents] = useState<any[]>([]);
  const [closeouts, setCloseouts] = useState<any[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<any[]>([]);
  const [macroGoals, setMacroGoals] = useState<any[]>([]);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);

  // Modals
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.get("/calendar");
      setEvents(data.events || []);
      setCloseouts(data.closeouts || []);
      setScheduledTasks(data.scheduledTasks || []);
      setMacroGoals(data.macroGoals || []);
      setDeadlines(data.deadlines || []);

      const year = currentDate.getFullYear();
      const cachedHolidays = localStorage.getItem(`holidays_${year}`);
      if (cachedHolidays) {
        setHolidays(JSON.parse(cachedHolidays));
      } else {
        const holidaysData = await api.get(`/calendar/holidays?year=${year}`);
        localStorage.setItem(`holidays_${year}`, JSON.stringify(holidaysData));
        setHolidays(holidaysData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // Only fetch on mount, rely on sync for manual refresh

  const handleManualSync = async () => {
    const year = currentDate.getFullYear();
    localStorage.removeItem(`holidays_${year}`);
    await fetchData();
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !newEventTitle.trim()) return;

    try {
      const data = await api.post("/calendar/events", {
        title: newEventTitle,
        date: selectedDate,
      });
      setEvents((prev) => [...prev, data]);
      setNewEventTitle("");
      setIsAddingEvent(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null || !selectedDate) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      const dateObj = new Date(selectedDate);
      if (diff > 0) {
        // Swipe left -> next day
        dateObj.setDate(dateObj.getDate() + 1);
      } else {
        // Swipe right -> prev day
        dateObj.setDate(dateObj.getDate() - 1);
      }
      setSelectedDate(dateObj.toISOString().split("T")[0]);
    }
    setTouchStart(null);
  };

  // Calendar Logic
  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  // Pad with nulls to complete the last row
  const totalSlots = Math.ceil(days.length / 7) * 7;
  while (days.length < totalSlots) {
    days.push(null);
  }

  const monthName = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const todayObj = getLogicalDate();
  // Helpers to get data for a specific date
  const getDateStr = (d: number) => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  };

  const isTodayDate = (d: number) => {
    return (
      year === todayObj.getFullYear() &&
      month === todayObj.getMonth() &&
      d === todayObj.getDate()
    );
  };

  const selectedCloseout = selectedDate
    ? closeouts.find((c) => c.date === selectedDate)
    : null;
  const selectedEvents = selectedDate
    ? events.filter((e) => e.date === selectedDate)
    : [];
  const selectedTasks = selectedDate
    ? scheduledTasks.filter((t) => t.scheduled_date === selectedDate)
    : [];
  const selectedMacroGoals = selectedDate
    ? macroGoals.filter((g) => g.deadline && g.deadline.startsWith(selectedDate))
    : [];
  const selectedDeadlines = selectedDate
    ? deadlines.filter((d) => d.deadline && d.deadline.startsWith(selectedDate))
    : [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 flex flex-col pb-32">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-8 h-8 text-[var(--text-primary)]" />
          <h1 className="text-4xl font-black uppercase tracking-tighter">Calendar Horizon</h1>
          <button
            onClick={handleManualSync}
            disabled={loading}
            className="ml-4 p-2 bg-[var(--bg-surface-raised)] border-2 border-[var(--border-brutal)] brutal-shadow-sm hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all text-[var(--text-primary)] group disabled:opacity-50"
            title="Force Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin text-[var(--accent)]" : "group-hover:rotate-180 transition-transform duration-500"}`} />
          </button>
        </div>
        <div className="flex items-center gap-4 border-2 border-[var(--border-brutal)] p-1 brutal-shadow-sm bg-[var(--bg-surface)]">
          <button
            onClick={prevMonth}
            className="p-1.5 hover:bg-[var(--bg-base)] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 font-black text-[var(--text-primary)]" />
          </button>
          <span className="text-sm font-black uppercase min-w-[120px] text-center">
            {monthName}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 hover:bg-[var(--bg-base)] transition-colors"
          >
            <ChevronRight className="w-5 h-5 font-black text-[var(--text-primary)]" />
          </button>
        </div>
      </div>

      <div className="border-2 border-[var(--border-brutal)] brutal-shadow bg-[var(--bg-base)] flex flex-col">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 border-b-2 border-[var(--border-brutal)] bg-[var(--bg-surface-raised)]">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-3 text-center text-xs font-black uppercase tracking-widest text-[var(--text-primary)] border-r-2 border-[var(--border-brutal)] last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div
          className="grid grid-cols-7 bg-[var(--border-brutal)] gap-[2px]"
          style={{
            gridTemplateRows: `repeat(${totalSlots / 7}, minmax(140px, 1fr))`,
          }}
        >
          {loading ? (
            <div className="col-span-7 row-span-full flex items-center justify-center bg-[var(--bg-base)] text-[var(--text-secondary)] font-black uppercase">
              Loading Calendar...
            </div>
          ) : (
            days.map((d, i) => {
              if (d === null)
                return (
                  <div key={`empty-${i}`} className="bg-[var(--bg-surface-raised)] opacity-50" />
                );

              const dateStr = getDateStr(d);
              const dayEvents = events.filter((e) => e.date === dateStr);
              const closeout = closeouts.find((c) => c.date === dateStr);
              const dayMacroGoals = macroGoals.filter((g) => g.deadline && g.deadline.startsWith(dateStr));
              const dayDeadlines = deadlines.filter((dl) => dl.deadline && dl.deadline.startsWith(dateStr));
              const dayHolidays = holidays.filter((h) => h.date === dateStr);
              const isSelected = selectedDate === dateStr;
              const isToday = isTodayDate(d);

              let bgClass = "bg-[var(--bg-base)] hover:bg-[var(--bg-surface)]";
              if (closeout) {
                if (closeout.total_completed >= 5)
                  bgClass = "bg-[#2ed573]/20 hover:bg-[#2ed573]/30";
                else if (closeout.total_completed > 0)
                  bgClass = "bg-[#2ed573]/10 hover:bg-[#2ed573]/20";
              }

              return (
                <div
                  key={i}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative p-2 cursor-pointer transition-colors ${bgClass} ${isSelected ? "ring-4 ring-inset ring-[var(--text-primary)] z-10 bg-[var(--bg-surface)]" : ""}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`text-lg font-black ${isToday ? "bg-[var(--text-primary)] text-[var(--bg-base)] w-8 h-8 flex items-center justify-center brutal-border" : "text-[var(--text-primary)]"}`}
                    >
                      {d}
                    </span>
                    {closeout && (
                      <span className="text-[10px] font-black bg-[var(--bg-surface-raised)] brutal-border px-1">
                        {closeout.total_completed}/{closeout.total_scheduled}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-hidden h-[85px]">
                    {/* Holidays */}
                    {dayHolidays.map((h, idx) => (
                      <div
                        key={`hol-${idx}`}
                        className="text-[9px] font-bold uppercase truncate bg-[#ffd32a] text-black px-1 py-0.5 rounded-sm flex items-center gap-1 opacity-80"
                      >
                        <Flag className="w-2.5 h-2.5 shrink-0" /> {h.name}
                      </div>
                    ))}
                    {/* Goal Deadlines */}
                    {dayMacroGoals.map((g) => (
                      <div
                        key={`mg-${g.id}`}
                        className="text-[10px] font-black uppercase leading-tight bg-[#ff4757] text-white border border-black brutal-shadow-sm px-1 py-0.5 truncate flex items-center gap-1"
                      >
                        <Flag className="w-3 h-3 flex-shrink-0" />
                        {g.title}
                      </div>
                    ))}
                    
                    {/* Standalone Deadlines */}
                    {dayDeadlines.map((dl) => (
                      <div
                        key={`dl-${dl.id}`}
                        className="text-[10px] font-black uppercase leading-tight bg-[#ffa502] text-black border border-black brutal-shadow-sm px-1 py-0.5 truncate flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {dl.title}
                      </div>
                    ))}

                    {/* Events */}
                    {dayEvents.map((e) => (
                      <div
                        key={`ev-${e.id}`}
                        className="text-[10px] font-bold leading-tight bg-[#4b7bff] text-white border border-black px-1 py-0.5 truncate"
                      >
                        {e.title}
                      </div>
                    ))}
                    
                    {/* Tasks */}
                    {scheduledTasks
                      .filter((t) => t.scheduled_date === dateStr)
                      .slice(0, 2)
                      .map((t) => (
                        <div
                          key={`t-${t.id}`}
                          className={`text-[9px] font-bold leading-tight flex items-center gap-1 px-1 py-0.5 truncate ${
                            t.status === "done"
                              ? "text-[var(--text-tertiary)] line-through"
                              : t.status === "skipped"
                                ? "text-[var(--warning)]"
                                : "text-[var(--text-secondary)]"
                          }`}
                        >
                          <span className="truncate flex-1">- {t.title}</span>
                        </div>
                      ))}
                    {scheduledTasks.filter((t) => t.scheduled_date === dateStr).length > 2 && (
                       <div className="text-[9px] font-black text-[var(--text-tertiary)] px-1">
                         +{scheduledTasks.filter((t) => t.scheduled_date === dateStr).length - 2} more tasks
                       </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Slide-over Details Panel */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`fixed inset-y-0 right-0 w-full md:w-[400px] bg-[var(--bg-base)] border-l-4 border-[var(--border-brutal)] brutal-shadow transition-transform duration-300 ease-in-out z-[100] ${selectedDate ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="h-full flex flex-col p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-8 border-b-2 border-[var(--border-brutal)] pb-4">
            <h2 className="text-2xl font-black uppercase">
              {selectedDate
                ? new Date(selectedDate).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : ""}
            </h2>
            <button
              onClick={() => {
                setSelectedDate(null);
                setIsAddingEvent(false);
              }}
              className="p-1 brutal-border brutal-shadow-sm hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform bg-[var(--bg-surface)] text-[var(--text-primary)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-8 pb-10">
            {/* Deadlines Section */}
            {(selectedMacroGoals.length > 0 || selectedDeadlines.length > 0) && (
              <section className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#ff4757] border-b-2 border-[#ff4757] pb-1">
                  Deadlines
                </h3>
                <div className="space-y-2">
                  {selectedMacroGoals.map((g) => (
                    <div key={`mg-p-${g.id}`} className="p-3 bg-[#ff4757] text-white border-2 border-black brutal-shadow-sm flex items-center gap-3">
                      <Flag className="w-5 h-5" />
                      <div>
                        <div className="text-[10px] font-black uppercase opacity-80">Goal Deadline</div>
                        <div className="font-bold text-sm">{g.title}</div>
                      </div>
                    </div>
                  ))}
                  {selectedDeadlines.map((dl) => (
                    <div key={`dl-p-${dl.id}`} className="p-3 bg-[#ffa502] text-black border-2 border-black brutal-shadow-sm flex items-center gap-3">
                      <AlertCircle className="w-5 h-5" />
                      <div>
                        <div className="text-[10px] font-black uppercase opacity-80">Standalone Deadline</div>
                        <div className="font-bold text-sm">{dl.title}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Events Section */}
            <section className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#4b7bff] border-b-2 border-[#4b7bff] pb-1">
                Events
              </h3>
              
              {isAddingEvent ? (
                <form onSubmit={handleAddEvent} className="flex gap-2 mb-4">
                  <input
                    autoFocus
                    required
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="Event title..."
                    className="flex-1 bg-[var(--bg-surface-raised)] border-2 border-[var(--border-brutal)] p-2 text-sm font-bold outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    type="submit"
                    className="bg-[#4b7bff] text-white px-4 font-black uppercase text-xs brutal-border brutal-shadow-sm hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
                  >
                    Add
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingEvent(true)}
                  className="bg-[var(--text-primary)] text-[var(--bg-base)] px-3 py-1.5 text-xs font-black uppercase brutal-border brutal-shadow-sm hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
                >
                  + Add Event
                </button>
              )}

              {selectedEvents.length === 0 && !isAddingEvent ? (
                <p className="text-xs font-bold text-[var(--text-secondary)] italic">
                  No events scheduled.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((e) => (
                    <div
                      key={e.id}
                      className="p-3 bg-[#4b7bff]/10 border-2 border-[#4b7bff] font-bold text-sm text-[var(--text-primary)] flex justify-between group"
                    >
                      <span>{e.title}</span>
                      <button
                        onClick={async () => {
                          try {
                            await api.delete(`/calendar/events/${e.id}`);
                            setEvents((prev) => prev.filter(ev => ev.id !== e.id));
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
                </div>
              )}
            </section>

            {/* Scheduled Tasks Section */}
            {selectedTasks.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest border-b-2 border-[var(--border-brutal)] pb-1">
                  Scheduled Tasks
                </h3>
                <div className="space-y-2">
                  {selectedTasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex flex-col gap-1 p-3 bg-[var(--bg-surface)] border-2 border-[var(--border-brutal)]"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            t.status === "done"
                              ? "bg-[#2ed573]"
                              : t.status === "skipped"
                                ? "bg-[var(--warning)]"
                                : "bg-[var(--text-secondary)]"
                          }`}
                        ></div>
                        <span
                          className={`text-sm font-bold ${
                            t.status === "done"
                              ? "text-[var(--text-tertiary)] line-through"
                              : t.status === "skipped"
                                ? "text-[var(--warning)]"
                                : "text-[var(--text-primary)]"
                          }`}
                        >
                          {t.title}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
      
      {selectedDate && (
        <div
          className="fixed inset-0 bg-black/60 z-[90] backdrop-blur-sm lg:hidden"
          onClick={() => {
            setSelectedDate(null);
            setIsAddingEvent(false);
          }}
        />
      )}
    </div>
  );
}
