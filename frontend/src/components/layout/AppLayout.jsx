import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/': 'Dashboard',
  '/pos': 'POS Terminal',
  '/products': 'Products',
  '/customers': 'Customers',
  '/sales': 'Sales',
  '/expenses': 'Expenses',
  '/reports': 'Reports',
  '/users': 'User Management',
  '/settings': 'Settings',
  '/sessions': 'POS Sessions',
  '/pricelists': 'Pricelists',
};

export default function AppLayout() {
  const { user, loading, setupComplete } = useAuth();
  const location = useLocation();

  if (loading) return <div className="h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  // Redirect to setup wizard if setup not complete (only for admin, skip on /setup itself)
  if (!setupComplete && user.role === 'admin' && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }

  const title = Object.entries(pageTitles).find(([path]) => location.pathname.startsWith(path))?.[1] || 'POS System';

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-60 flex flex-col">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
