import { ChevronLeft, ChevronRight } from "lucide-react";
import { getLogicalDate } from "../lib/dateUtils";

interface BrutalistCalendarProps {
  currentDate: Date;
  selectedDateStr: string;
  events: any[];
  closeouts: any[];
  onSelectDate: (dateStr: string) => void;
  onMonthChange: (newDate: Date) => void;
}

export default function BrutalistCalendar({
  currentDate,
  selectedDateStr,
  events,
  closeouts,
  onSelectDate,
  onMonthChange,
}: BrutalistCalendarProps) {
  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => onMonthChange(new Date(year, month - 1, 1));
  const nextMonth = () => onMonthChange(new Date(year, month + 1, 1));

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const totalSlots = Math.ceil(days.length / 7) * 7;
  while (days.length < totalSlots) {
    days.push(null);
  }

  const monthName = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const todayObj = getLogicalDate();
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

  return (
    <div className="bg-[var(--bg-surface)] border-t-4 border-l-4 border-[var(--border-brutal)] brutal-shadow-sm flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b-2 border-[var(--border-brutal)] bg-[#ffeb3b]">
        <button
          onClick={prevMonth}
          className="p-1 hover:bg-black hover:text-[#ffeb3b] border-2 border-transparent hover:border-black transition-colors cursor-pointer text-black"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-black uppercase tracking-widest text-black">
          {monthName}
        </span>
        <button
          onClick={nextMonth}
          className="p-1 hover:bg-black hover:text-[#ffeb3b] border-2 border-transparent hover:border-black transition-colors cursor-pointer text-black"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b-2 border-[var(--border-brutal)] bg-[var(--bg-surface-raised)]">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-xs font-black uppercase text-[var(--text-secondary)] border-r-2 border-[var(--border-brutal)] last:border-r-0"
          >
            {day.charAt(0)}
          </div>
        ))}
      </div>

      <div
        className="grid grid-cols-7 bg-[var(--border-brutal)] gap-[2px]"
        style={{
          gridTemplateRows: `repeat(${totalSlots / 7}, minmax(48px, 1fr))`,
        }}
      >
        {days.map((d, i) => {
          if (d === null)
            return (
              <div
                key={`empty-${i}`}
                className="bg-[var(--bg-surface-raised)]"
              />
            );

          const dateStr = getDateStr(d);
          const dayEvents = events.filter((e) => e.date === dateStr);
          const closeout = closeouts.find((c) => c.date === dateStr);
          const isSelected = selectedDateStr === dateStr;
          const isToday = isTodayDate(d);

          let bgClass =
            "bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)]";
          if (closeout) {
            if (closeout.total_completed >= 5) bgClass = "bg-[#2ed573]";
            else if (closeout.total_completed > 0) bgClass = "bg-[#a8e6cf]";
          }
          if (isSelected)
            bgClass = "bg-[var(--text-primary)] text-[var(--bg-base)]";

          return (
            <div
              key={i}
              onClick={() => onSelectDate(dateStr)}
              className={`relative p-1 cursor-pointer transition-colors flex flex-col ${bgClass}`}
            >
              <div className="flex justify-between items-start">
                <span
                  className={`text-xs font-bold ${
                    isToday && !isSelected
                      ? "text-[#ff6b6b] underline decoration-2 underline-offset-2"
                      : isSelected
                        ? "text-[var(--bg-base)]"
                        : "text-[var(--text-primary)]"
                  }`}
                >
                  {d}
                </span>
              </div>
              <div className="mt-auto flex flex-wrap gap-0.5 justify-end">
                {dayEvents.map((e) => (
                  <div
                    key={e.id}
                    className="w-1.5 h-1.5 rounded-full bg-[#ff6b6b]"
                    title={e.title}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
