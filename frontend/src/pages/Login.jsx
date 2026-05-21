import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50 relative overflow-hidden">
      {/* Background logo pattern */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <svg className="absolute -top-32 -right-32 w-[28rem] h-[28rem] text-primary-100/40" viewBox="0 0 200 200" fill="currentColor">
          <path d="M100 0L200 50v100L100 200 0 150V50L100 0z" />
          <rect x="70" y="70" width="60" height="60" rx="8" fill="white" opacity="0.5" />
          <rect x="80" y="80" width="12" height="8" rx="2" />
          <rect x="96" y="80" width="12" height="8" rx="2" />
          <rect x="112" y="80" width="12" height="8" rx="2" />
          <rect x="80" y="94" width="40" height="4" rx="1" />
          <circle cx="100" cy="110" r="8" />
        </svg>
        <svg className="absolute -bottom-20 -left-20 w-[20rem] h-[20rem] text-primary-100/30" viewBox="0 0 200 200" fill="currentColor">
          <circle cx="100" cy="100" r="90" />
          <rect x="60" y="60" width="80" height="80" rx="16" fill="white" />
          <circle cx="100" cy="100" r="30" fill="currentColor" opacity="0.5" />
        </svg>
        <svg className="absolute top-1/3 left-1/4 w-8 h-8 text-primary-200/20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <svg className="absolute bottom-1/3 right-1/4 w-6 h-6 text-primary-200/20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>

      <div className="relative bg-white rounded-2xl shadow-xl shadow-primary-100/50 border border-gray-100 p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-200 ring-4 ring-primary-50">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18v18H3V3zm4 4h10v2H7V7zm0 4h10v2H7v-2zm0 4h6v2H7v-2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">POS System</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-4 flex items-center gap-2 animate-shake">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            placeholder="Enter your username"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
          />
          <Button
            className="w-full !bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 !shadow-lg !shadow-primary-200 hover:!shadow-xl hover:!shadow-primary-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            type="submit"
            disabled={loading}
            size="lg"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Signing in...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Sign In
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
              </span>
            )}
          </Button>
        </form>
      </div>
      <p className="relative mt-6 text-xs text-gray-400">POS System v1.0</p>
    </div>
  );
}
