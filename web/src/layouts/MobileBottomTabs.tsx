import { NavLink } from 'react-router-dom';
import { Calendar, Target, Lightbulb, Lock, Menu } from 'lucide-react';

const tabs = [
  { name: 'Today', path: '/today', icon: Calendar },
  { name: 'Goals', path: '/goals', icon: Target },
  { name: 'Opps', path: '/opportunities', icon: Lightbulb },
  { name: 'Vault', path: '/vault', icon: Lock },
  { name: 'More', path: '/settings', icon: Menu },
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
