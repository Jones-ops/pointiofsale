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
    <aside className="w-60 bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-lg font-bold">POS System</h1>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.adminOnly && user?.role !== 'admin') return null;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`
              }
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-3 border-t border-gray-700">
        <div className="text-xs text-gray-400 mb-2">Logged in as <span className="text-white font-medium">{user?.name}</span></div>
      </div>
    </aside>
  );
}
