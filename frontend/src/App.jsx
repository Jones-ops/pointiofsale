import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';
import SetupWizard from './pages/SetupWizard';
import Sessions from './pages/Sessions';
import Pricelists from './pages/Pricelists';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<SetupWizard />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/products" element={<Products />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/users" element={<Users />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/pricelists" element={<Pricelists />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
