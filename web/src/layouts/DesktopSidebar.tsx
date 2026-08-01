import { NavLink } from "react-router-dom";
import { useState } from "react";
import {
  Calendar as CalendarIcon,
  ListTodo,
  Target,
  Lightbulb,
  Inbox,
  Users,
  Settings,
  Lock,
  BarChart2,
  Timer,
  PieChart,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const navItems = [
  { name: "Focus", path: "/focus", icon: Target },
  { name: "Pomodoro", path: "/pomodoro", icon: Timer },
  { name: "Analytics", path: "/routines-history", icon: PieChart },
  { name: "Backlog", path: "/backlog", icon: ListTodo },
  { name: "Goals", path: "/goals", icon: BarChart2 },
  { name: "Deadlines", path: "/opportunities", icon: Lightbulb },
  { name: "Captures", path: "/captures", icon: Inbox },
  { name: "Notes", path: "/notes", icon: ListTodo },
  { name: "Vault", path: "/vault", icon: Lock },
  { name: "Partner", path: "/partner", icon: Users },
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function DesktopSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`flex flex-col h-full py-4 transition-all duration-300 ${isCollapsed ? "w-[68px] px-2" : "w-[240px] px-3"}`}
    >
      <div
        className={`flex items-center mb-6 ${isCollapsed ? "justify-center px-0" : "justify-between px-3"}`}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#ffeb3b] brutal-border brutal-shadow-sm flex items-center justify-center translate-y-[-2px]">
              <span className="font-black text-black text-lg leading-none">
                N
              </span>
            </div>
            <h2 className="text-xl font-black tracking-widest text-black uppercase">
              Nest
            </h2>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 text-black hover:bg-black hover:text-white brutal-border transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            title={isCollapsed ? item.name : undefined}
            className={({ isActive }) =>
              `flex items-center text-sm font-bold transition-all duration-75 border-2 ${
                isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2"
              } ${
                isActive
                  ? "bg-[#a8e6cf] text-black border-black brutal-shadow-sm translate-x-[2px] translate-y-[2px]"
                  : "text-black border-transparent hover:border-black hover:bg-[var(--bg-base)] hover:brutal-shadow-sm hover:-translate-x-[2px] hover:-translate-y-[2px]"
              }`
            }
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
