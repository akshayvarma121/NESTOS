import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { UserAvatar } from "../components/AvatarPicker";
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
  ChevronRight,
} from "lucide-react";
import LiveUsersCounter from "../components/LiveUsersCounter";

const navGroups = [
  {
    label: "Execution",
    items: [
      { name: "Focus", path: "/focus", icon: Target },
      { name: "Timer", path: "/timer", icon: Timer },
    ],
  },
  {
    label: "Planning",
    items: [
      { name: "Calendar", path: "/calendar", icon: CalendarIcon },
      { name: "Backlog", path: "/backlog", icon: ListTodo },
      { name: "Goals", path: "/goals", icon: BarChart2 },
      { name: "Deadlines", path: "/opportunities", icon: Lightbulb },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { name: "Notes", path: "/notes", icon: ListTodo },
      { name: "Analytics", path: "/routines-history", icon: PieChart },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Partner", path: "/partner", icon: Users, badge: "BETA" },
      { name: "Vault", path: "/vault", icon: Lock },
      { name: "Settings", path: "/settings", icon: Settings },
    ],
  },
];

export default function DesktopSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();

  const name =
    user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const email = user?.email || "";
  const initials = name.substring(0, 2).toUpperCase();

  return (
    <div
      className={`flex flex-col h-full transition-all duration-300 ${
        isCollapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      <div
        className={`flex items-center pt-2 pb-6 px-3 ${
          isCollapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#ffeb3b] brutal-border brutal-shadow-sm flex items-center justify-center translate-y-[-2px]">
              <span className="font-black text-black text-lg leading-none">
                N
              </span>
            </div>
            <h2 className="text-xl font-black tracking-widest text-[var(--text-primary)] uppercase">
              Nest
            </h2>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-base)] brutal-border transition-colors flex-shrink-0"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4">
        {navGroups.map((group, groupIdx) => (
          <div key={group.label} className="mb-6 last:mb-0">
            {isCollapsed ? (
              <div className="w-full h-px bg-[var(--border-hairline)] my-3 opacity-50" />
            ) : (
              <h3 className="text-[10px] font-black font-mono uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-2 px-2">
                {group.label}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  title={isCollapsed ? item.name : undefined}
                  className={({ isActive }) =>
                    `flex items-center text-sm font-bold transition-all duration-75 border-2 rounded-lg ${
                      isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2"
                    } ${
                      isActive
                        ? "bg-[#a8e6cf] text-black border-black brutal-shadow-sm translate-x-[2px] translate-y-[2px]"
                        : "text-[var(--text-primary)] border-transparent hover:border-[var(--border-brutal)] hover:bg-[var(--bg-surface-raised)] hover:brutal-shadow-sm hover:-translate-x-[2px] hover:-translate-y-[2px]"
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1">
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className="text-[10px] font-black uppercase bg-[#ff6b6b] text-white px-1.5 py-0.5 rounded border border-black shadow-sm">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Live Users Counter */}
      <div className={`px-3 pb-3 ${isCollapsed ? "flex justify-center" : ""}`}>
        <LiveUsersCounter showText={!isCollapsed} />
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t-2 border-[var(--border-brutal)] bg-[var(--bg-surface)]">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `w-full flex items-center justify-between p-2 rounded-xl border-2 transition-all text-left group ${
              isActive
                ? "border-[var(--border-brutal)] bg-[var(--bg-surface-raised)] brutal-shadow-sm -translate-y-1"
                : "border-transparent hover:border-[var(--border-brutal)] hover:bg-[var(--bg-surface-raised)] hover:brutal-shadow-sm hover:-translate-y-1"
            }`
          }
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <UserAvatar
              avatarStyle={user?.user_metadata?.avatarStyle}
              avatarSeed={user?.user_metadata?.avatarSeed}
              initials={initials}
              size="md"
            />
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                  {name}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] truncate">
                  {email}
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <Settings className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors flex-shrink-0" />
          )}
        </NavLink>
      </div>
    </div>
  );
}
