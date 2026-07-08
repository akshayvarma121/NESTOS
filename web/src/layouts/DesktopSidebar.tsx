import { NavLink } from 'react-router-dom';
import { Calendar, ListTodo, Target, Lightbulb, Inbox, Users, Settings, Lock } from 'lucide-react';

const navItems = [
  { name: 'Focus', path: '/focus', icon: Calendar },
  { name: 'Backlog', path: '/backlog', icon: ListTodo },
  { name: 'Goals', path: '/goals', icon: Target },
  { name: 'Deadlines', path: '/opportunities', icon: Lightbulb },
  { name: 'Captures', path: '/captures', icon: Inbox },
  { name: 'Vault', path: '/vault', icon: Lock },
  { name: 'Partner', path: '/partner', icon: Users },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function DesktopSidebar() {
  return (
    <div className="flex flex-col h-full w-full py-4 px-3">
      <div className="px-3 mb-6">
        <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)] uppercase">NestOS</h2>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[var(--bg-surface-raised)] text-[var(--text-primary)] font-medium'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-base)] hover:text-[var(--text-primary)]'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
