import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon, ShoppingCartIcon, CubeIcon, UsersIcon,
  CurrencyDollarIcon, ChartBarIcon, Cog6ToothIcon,
  UserGroupIcon, ClockIcon, TagIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/', label: 'Dashboard', icon: HomeIcon },
  { to: '/pos', label: 'POS Terminal', icon: ShoppingCartIcon },
  { to: '/products', label: 'Products', icon: CubeIcon },
  { to: '/customers', label: 'Customers', icon: UsersIcon },
  { to: '/sales', label: 'Sales', icon: CurrencyDollarIcon },
  { to: '/expenses', label: 'Expenses', icon: CurrencyDollarIcon },
  { to: '/reports', label: 'Reports', icon: ChartBarIcon },
  { to: '/sessions', label: 'Sessions', icon: ClockIcon, adminOnly: true },
  { to: '/pricelists', label: 'Pricelists', icon: TagIcon, adminOnly: true },
  { to: '/users', label: 'Users', icon: UserGroupIcon, adminOnly: true },
  { to: '/settings', label: 'Settings', icon: Cog6ToothIcon, adminOnly: true },
];

export default function Sidebar() {
  const { user } = useAuth();
  return (
    <aside className="w-60 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-40">
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18v18H3V3zm4 4h10v2H7V7zm0 4h10v2H7v-2zm0 4h6v2H7v-2z" />
            </svg>
          </div>
          <h1 className="text-base font-bold tracking-tight">POS System</h1>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          if (item.adminOnly && user?.role !== 'admin') return null;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive ? 'bg-primary-600 text-white shadow-sm shadow-primary-700/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{user?.name}</div>
            <div className="text-xs text-slate-400 capitalize">{user?.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
