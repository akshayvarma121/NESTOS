import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  ListTodo,
  Target,
  Menu,
  Users,
  Settings,
  Lock,
  BarChart2,
  X,
  Timer,
  PieChart,
  Lightbulb,
} from "lucide-react";
import SpeedDial from "../components/SpeedDial";

const mainTabs = [{ name: "Focus", path: "/focus", icon: Target }];

const secondaryTabs = [{ name: "Backlog", path: "/backlog", icon: ListTodo }];

const moreTabs = [
  { name: "Calendar", path: "/calendar", icon: CalendarIcon },
  { name: "Timer", path: "/timer", icon: Timer },
  { name: "Goals", path: "/goals", icon: BarChart2 },
  { name: "Dates", path: "/opportunities", icon: Lightbulb },
  { name: "Notes", path: "/notes", icon: ListTodo },
  { name: "Analytics", path: "/routines-history", icon: PieChart },
  { name: "Partner", path: "/partner", icon: Users, badge: "BETA" },
  { name: "Vault", path: "/vault", icon: Lock },
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function MobileBottomTabs() {
  const [showMore, setShowMore] = useState(false);

  const triggerHaptic = () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  return (
    <>
      <div className="flex justify-around items-center h-[60px] px-2 bg-[var(--bg-surface-raised)] relative z-50">
        {mainTabs.map((tab) => (
          <NavLink
            key={tab.name}
            to={tab.path}
            onClick={() => {
              triggerHaptic();
              setShowMore(false);
            }}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center h-full min-h-[44px] transition-colors border-t-[3px] ${
                isActive
                  ? "border-black text-black"
                  : "border-transparent text-black/50 hover:text-black"
              }`
            }
          >
            <tab.icon className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">{tab.name}</span>
          </NavLink>
        ))}

        {/* Speed Dial Menu */}
        <div className="flex-1 flex justify-center items-center">
          <SpeedDial />
        </div>

        {secondaryTabs.map((tab) => (
          <NavLink
            key={tab.name}
            to={tab.path}
            onClick={() => {
              triggerHaptic();
              setShowMore(false);
            }}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center h-full min-h-[44px] transition-colors border-t-[3px] ${
                isActive
                  ? "border-black text-black"
                  : "border-transparent text-black/50 hover:text-black"
              }`
            }
          >
            <tab.icon className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">{tab.name}</span>
          </NavLink>
        ))}

        <button
          onClick={() => {
            triggerHaptic();
            setShowMore(!showMore);
          }}
          className={`flex-1 flex flex-col items-center justify-center h-full min-h-[44px] transition-colors border-t-[3px] ${
            showMore
              ? "border-black text-black"
              : "border-transparent text-black/50 hover:text-black"
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
            className="fixed inset-0 bg-black/80 z-30 transition-opacity"
            onClick={() => setShowMore(false)}
          />
          <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+60px)] left-0 right-0 bg-white brutal-border brutal-shadow-lg z-40 p-4 animate-in slide-in-from-bottom-2 m-2">
            <div className="grid grid-cols-4 gap-4">
              {moreTabs.map((tab) => (
                <NavLink
                  key={tab.name}
                  to={tab.path}
                  onClick={() => {
                    triggerHaptic();
                    setShowMore(false);
                  }}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center p-3 gap-2 transition-all duration-75 brutal-border ${
                      isActive
                        ? "bg-[#ffeb3b] text-black brutal-shadow-sm translate-x-[2px] translate-y-[2px]"
                        : "text-black border-transparent hover:border-black hover:brutal-shadow-sm hover:-translate-x-[2px] hover:-translate-y-[2px]"
                    }`
                  }
                >
                  <div className="relative">
                    <tab.icon className="w-6 h-6" />
                    {tab.badge && (
                      <span className="absolute -top-2 -right-4 text-[8px] font-black uppercase bg-[#ff6b6b] text-white px-1 rounded shadow-sm border border-black">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{tab.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
