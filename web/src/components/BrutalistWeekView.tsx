import { ChevronLeft, ChevronRight } from "lucide-react";
import { getLogicalDate } from "../lib/dateUtils";

interface BrutalistWeekViewProps {
  currentDate: Date;
  selectedDateStr: string;
  events: any[];
  closeouts: any[];
  holidays?: any[];
  onSelectDate: (dateStr: string) => void;
  onWeekChange: (newDate: Date) => void;
}

export default function BrutalistWeekView({
  currentDate,
  selectedDateStr,
  events,
  closeouts,
  holidays = [],
  onSelectDate,
  onWeekChange,
}: BrutalistWeekViewProps) {
  // Find the Monday of the current week
  const currentDayOfWeek = currentDate.getDay(); // 0 = Sun, 1 = Mon, etc.
  const distanceToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - distanceToMonday);

  const prevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    onWeekChange(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    onWeekChange(newDate);
  };

  const todayObj = getLogicalDate();

  const getDateStr = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const isTodayDate = (d: Date) => {
    return (
      d.getFullYear() === todayObj.getFullYear() &&
      d.getMonth() === todayObj.getMonth() &&
      d.getDate() === todayObj.getDate()
    );
  };

  const monthName = startOfWeek.toLocaleString("default", {
    month: "short",
  });
  const yearName = startOfWeek.getFullYear();

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push(d);
  }

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between border-b-2 border-[var(--border-brutal)] pb-2">
        <span className="text-xl font-black uppercase tracking-widest text-[var(--text-primary)]">
          {monthName} {yearName}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="p-1 hover:bg-[var(--text-primary)] hover:text-[var(--bg-base)] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextWeek}
            className="p-1 hover:bg-[var(--text-primary)] hover:text-[var(--bg-base)] transition-colors cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((d, i) => {
          const dateStr = getDateStr(d);
          const dayEvents = events.filter((e) => e.date === dateStr);
          const dayHolidays = holidays.filter((h) => h.date === dateStr);
          const closeout = closeouts.find((c) => c.date === dateStr);
          const isSelected = selectedDateStr === dateStr;
          const isToday = isTodayDate(d);

          let bgClass = "bg-transparent hover:bg-[var(--bg-surface-raised)]";
          let borderClass = "border-t-[3px] border-transparent hover:border-[var(--border-brutal)]";

          if (closeout) {
            if (closeout.total_completed >= 5) borderClass = "border-t-[3px] border-[#2ed573]";
            else if (closeout.total_completed > 0) borderClass = "border-t-[3px] border-[#a8e6cf]";
          }

          if (isSelected) {
            bgClass = "bg-[var(--text-primary)]";
            borderClass = "border-t-[3px] border-[var(--text-primary)]";
          }

          return (
            <div
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`relative cursor-pointer transition-colors flex flex-col p-2 min-h-[80px] ${bgClass} ${borderClass}`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? "text-[var(--bg-base)] opacity-70" : "text-[var(--text-secondary)]"}`}>
                  {dayNames[i]}
                </span>
                <span
                  className={`text-lg font-black ${
                    isToday && !isSelected
                      ? "text-[#ff6b6b]"
                      : isSelected
                        ? "text-[var(--bg-base)]"
                        : "text-[var(--text-primary)]"
                  }`}
                >
                  {d.getDate()}
                </span>
              </div>
              
              <div className="mt-auto flex flex-col items-center gap-1 pt-2">
                <div className="flex justify-center gap-1">
                  {dayEvents.map((e) => (
                    <div
                      key={e.id}
                      className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-[#ffeb3b]" : "bg-[#ff6b6b]"}`}
                      title={e.title}
                    />
                  ))}
                  {dayHolidays.map((h, idx) => (
                    <div
                      key={`h-${idx}`}
                      className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-[#ffb6c1]" : "bg-[#ffd32a]"}`}
                      title={h.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
