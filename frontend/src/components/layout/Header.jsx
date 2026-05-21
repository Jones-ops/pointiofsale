import { useAuth } from '../../context/AuthContext';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function Header({ title }) {
  const { logout } = useAuth();
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      <button onClick={logout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors">
        <ArrowRightOnRectangleIcon className="w-5 h-5" />
        Logout
      </button>
    </header>
  );
}
