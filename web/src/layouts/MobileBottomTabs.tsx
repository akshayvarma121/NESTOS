import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  ListTodo,
  Target,
  Lightbulb,
  Inbox,
  Menu,
  Users,
  Settings,
  Lock,
  BarChart2,
  X,
  Timer,
  PieChart,
} from "lucide-react";

const mainTabs = [
  { name: "Focus", path: "/focus", icon: Target },
  { name: "Calendar", path: "/calendar", icon: CalendarIcon },
  { name: "Backlog", path: "/backlog", icon: ListTodo },
  { name: "Dates", path: "/opportunities", icon: Lightbulb },
];

const moreTabs = [
  { name: "Pomodoro", path: "/pomodoro", icon: Timer },
  { name: "Analytics", path: "/routines-history", icon: PieChart },
  { name: "Goals", path: "/goals", icon: BarChart2 },
  { name: "Captures", path: "/captures", icon: Inbox },
  { name: "Notes", path: "/notes", icon: ListTodo },
  { name: "Vault", path: "/vault", icon: Lock },
  { name: "Partner", path: "/partner", icon: Users },
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function MobileBottomTabs() {
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      <div className="flex justify-around items-center h-[60px] px-2 bg-[var(--bg-surface-raised)] relative z-50">
        {mainTabs.map((tab) => (
          <NavLink
            key={tab.name}
            to={tab.path}
            onClick={() => setShowMore(false)}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center h-full min-h-[44px] ${
                isActive
                  ? "text-[var(--accent)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`
            }
          >
            <tab.icon className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">{tab.name}</span>
          </NavLink>
        ))}

        <button
          onClick={() => setShowMore(!showMore)}
          className={`flex-1 flex flex-col items-center justify-center h-full min-h-[44px] ${
            showMore
              ? "text-[var(--accent)]"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          }`}
        >
          {showMore ? (
            <X className="w-5 h-5 mb-1" />
          ) : (
            <Menu className="w-5 h-5 mb-1" />
          )}
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>

      {showMore && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setShowMore(false)}
          />
          <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+60px)] left-0 right-0 bg-[var(--bg-surface-raised)] border-t border-[var(--border-hairline)] z-40 p-4 animate-in slide-in-from-bottom-2">
            <div className="grid grid-cols-3 gap-4">
              {moreTabs.map((tab) => (
                <NavLink
                  key={tab.name}
                  to={tab.path}
                  onClick={() => setShowMore(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center p-3 rounded-xl gap-2 ${
                      isActive
                        ? "bg-[var(--bg-base)] text-[var(--accent)] border border-[var(--border-hairline)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-base)]"
                    }`
                  }
                >
                  <tab.icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{tab.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
