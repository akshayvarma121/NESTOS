import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { getLogicalDate } from "../lib/dateUtils";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from "lucide-react";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(getLogicalDate());
  const [loading, setLoading] = useState(true);

  // Data
  const [events, setEvents] = useState<any[]>([]);
  const [closeouts, setCloseouts] = useState<any[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<any[]>([]);

  // Modals
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.get("/calendar");
      setEvents(data.events || []);
      setCloseouts(data.closeouts || []);
      setScheduledTasks(data.scheduledTasks || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentDate]);

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

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 flex flex-col pb-32">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-[var(--accent)]" />
          <h1 className="text-2xl font-semibold">Calendar & Analytics</h1>
        </div>
        <div className="flex items-center gap-4 bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] rounded-lg p-1">
          <button
            onClick={prevMonth}
            className="p-1.5 hover:bg-[var(--bg-base)] rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            {monthName}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 hover:bg-[var(--bg-base)] rounded transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl overflow-hidden flex flex-col shadow-sm">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 border-b border-[var(--border-hairline)] bg-[var(--bg-surface-raised)]">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-2 text-center text-xs font-medium text-[var(--text-secondary)]"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div
          className="grid grid-cols-7 bg-[var(--border-hairline)] gap-px"
          style={{
            gridTemplateRows: `repeat(${totalSlots / 7}, minmax(100px, 1fr))`,
          }}
        >
          {loading ? (
            <div className="col-span-7 row-span-full flex items-center justify-center bg-[var(--bg-base)] text-[var(--text-secondary)]">
              Loading Analytics...
            </div>
          ) : (
            days.map((d, i) => {
              if (d === null)
                return (
                  <div key={`empty-${i}`} className="bg-[var(--bg-surface)]" />
                );

              const dateStr = getDateStr(d);
              const dayEvents = events.filter((e) => e.date === dateStr);
              const closeout = closeouts.find((c) => c.date === dateStr);
              const isSelected = selectedDate === dateStr;
              const isToday = isTodayDate(d);

              // Simple visual density logic for heatmap
              let bgClass =
                "bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)]";
              if (closeout) {
                if (closeout.total_completed >= 5)
                  bgClass = "bg-[#10b981]/20 hover:bg-[#10b981]/30";
                else if (closeout.total_completed > 0)
                  bgClass = "bg-[#10b981]/10 hover:bg-[#10b981]/20";
              }

              return (
                <div
                  key={i}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative p-2 cursor-pointer transition-colors ${bgClass} ${isSelected ? "ring-2 ring-inset ring-[var(--accent)] z-10" : ""}`}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`text-sm font-medium ${isToday ? "bg-[var(--accent)] text-white w-6 h-6 flex items-center justify-center rounded-full" : isSelected ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}`}
                    >
                      {d}
                    </span>
                    {closeout && (
                      <span className="text-[9px] font-mono text-[var(--text-secondary)] bg-[var(--bg-base)] border border-[var(--border-hairline)] px-1 rounded-sm">
                        {closeout.total_completed}/{closeout.total_scheduled}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 space-y-1 overflow-hidden h-[40px] lg:h-[60px]">
                    {dayEvents.map((e) => (
                      <div
                        key={e.id}
                        className="text-[10px] leading-tight bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 rounded px-1 py-0.5 truncate"
                      >
                        {e.title}
                      </div>
                    ))}
                    {scheduledTasks
                      .filter((t) => t.scheduled_date === dateStr)
                      .slice(0, 3)
                      .map((t) => (
                      <div
                        key={t.id}
                        className={`text-[9px] leading-tight flex items-center gap-1 rounded px-1 py-0.5 truncate ${
                          t.status === "done" 
                            ? "bg-[#10b981]/10 text-[#10b981] line-through" 
                            : t.status === "skipped"
                            ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                            : "bg-[var(--bg-surface-raised)] text-[var(--text-secondary)]"
                        }`}
                      >
                        <span className="truncate">{t.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Slide-over Details Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full md:w-[400px] bg-[var(--bg-surface)] border-l border-[var(--border-hairline)] shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-[100] ${selectedDate ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="h-full flex flex-col p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
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
              className="p-2 -mr-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-8 pr-2">
            {/* Events Section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2">
                <h3 className="text-sm font-medium">Events & Reminders</h3>
                <button
                  onClick={() => setIsAddingEvent(!isAddingEvent)}
                  className="text-xs bg-[var(--bg-surface-raised)] hover:text-white px-2 py-1 rounded transition-colors"
                >
                  {isAddingEvent ? "Cancel" : "+ Add Event"}
                </button>
              </div>

              {isAddingEvent && (
                <form onSubmit={handleAddEvent} className="flex gap-2 mb-4">
                  <input
                    autoFocus
                    required
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="e.g. ML Midterm"
                    className="flex-1 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    type="submit"
                    className="bg-[var(--accent)] text-white px-3 rounded-md text-sm font-medium"
                  >
                    Add
                  </button>
                </form>
              )}

              {selectedEvents.length === 0 && !isAddingEvent ? (
                <p className="text-xs text-[var(--text-secondary)]">
                  No events scheduled.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((e) => (
                    <div
                      key={e.id}
                      className="p-2 bg-[var(--accent)]/5 border border-[var(--accent)]/20 rounded-md text-sm text-[var(--text-primary)]"
                    >
                      {e.title}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Analytics Section */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium border-b border-[var(--border-hairline)] pb-2">
                Day Summary
              </h3>
              {selectedCloseout ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] rounded-lg text-center">
                    <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                      Completed
                    </p>
                    <p className="text-xl font-semibold text-[#10b981]">
                      {selectedCloseout.total_completed}
                    </p>
                  </div>
                  <div className="p-3 bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] rounded-lg text-center">
                    <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                      Scheduled
                    </p>
                    <p className="text-xl font-semibold">
                      {selectedCloseout.total_scheduled}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-secondary)]">
                  No close-out data for this day.
                </p>
              )}
            </section>

            {/* Scheduled Tasks Section */}
            {selectedTasks.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-sm font-medium border-b border-[var(--border-hairline)] pb-2">
                  Scheduled Tasks (Slices)
                </h3>
                <div className="space-y-1.5">
                  {selectedTasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex flex-col gap-0.5 p-2 bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          t.status === "done" ? "bg-[#10b981]" : t.status === "skipped" ? "bg-[var(--warning)]" : "bg-[var(--text-secondary)]"
                        }`}></div>
                        <span className={`text-sm ${
                          t.status === "done" ? "text-[var(--text-tertiary)] line-through" : t.status === "skipped" ? "text-[var(--warning)]" : "text-[var(--text-primary)]"
                        }`}>
                          {t.title}
                        </span>
                        {t.status === "pending" && (
                          <span className="text-[10px] uppercase font-medium bg-[var(--text-secondary)]/20 text-[var(--text-secondary)] px-1.5 rounded ml-auto">
                            Pending
                          </span>
                        )}
                      </div>
                      {t.description && (
                        <p className="text-[11px] text-[var(--text-tertiary)] italic pl-3.5 line-clamp-2">
                          {t.description}
                        </p>
                      )}
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
          className="fixed inset-0 bg-black/40 z-[90] backdrop-blur-sm lg:hidden"
          onClick={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
