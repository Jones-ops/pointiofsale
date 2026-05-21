import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function SessionOpen({ onOpen, loading }) {
  const [cash, setCash] = useState('');

  const handleOpen = () => {
    onOpen(Number(cash) || 0);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Open POS Session</h2>
        <p className="text-sm text-gray-500 mb-4">Enter the starting cash amount in the drawer</p>
        <Input
          type="number"
          placeholder="0.00"
          value={cash}
          onChange={(e) => setCash(e.target.value)}
          className="text-center text-2xl font-bold"
          autoFocus
        />
        <Button className="w-full mt-4" onClick={handleOpen} disabled={loading}>
          {loading ? 'Opening...' : 'Open Session'}
        </Button>
      </div>
    </div>
  );
}
