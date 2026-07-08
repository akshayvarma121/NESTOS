import { NavLink } from 'react-router-dom';
import { Calendar as CalendarIcon, ListTodo, Target, Lightbulb, Inbox } from 'lucide-react';

const tabs = [
  { name: 'Focus', path: '/focus', icon: Target },
  { name: 'Calendar', path: '/calendar', icon: CalendarIcon },
  { name: 'Backlog', path: '/backlog', icon: ListTodo },
  { name: 'Dates', path: '/opportunities', icon: Lightbulb },
  { name: 'Inbox', path: '/captures', icon: Inbox },
];

export default function MobileBottomTabs() {
  return (
    <div className="flex justify-around items-center h-[60px] px-2">
      {tabs.map((tab) => (
        <NavLink
          key={tab.name}
          to={tab.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full min-h-[44px] min-w-[44px] ${
              isActive ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`
          }
        >
          <tab.icon className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">{tab.name}</span>
        </NavLink>
      ))}
    </div>
  );
}
