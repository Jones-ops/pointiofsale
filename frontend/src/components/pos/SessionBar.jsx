import { useState, useEffect } from 'react';

export default function SessionBar({ session, onClose, onCashMove }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!session) return;
    const update = () => {
      const diff = Date.now() - new Date(session.opened_at).getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setElapsed(`${h}h ${m}m`);
    };
    update();
    const iv = setInterval(update, 60000);
    return () => clearInterval(iv);
  }, [session]);

  if (!session) return null;

  return (
    <div className="flex items-center justify-between bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 mb-2 text-sm">
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <span className="font-medium text-primary-900">Session #{session.id}</span>
        <span className="text-primary-700">{elapsed}</span>
        <span className="text-primary-600">Opening: {new Intl.NumberFormat().format(Number(session.opening_cash || 0).toFixed(2))}</span>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onCashMove('in')} className="px-2 py-1 text-xs border border-green-300 text-green-700 rounded hover:bg-green-50">Cash In</button>
        <button onClick={() => onCashMove('out')} className="px-2 py-1 text-xs border border-red-300 text-red-700 rounded hover:bg-red-50">Cash Out</button>
        <button onClick={onClose} className="px-3 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700">Close Session</button>
      </div>
    </div>
  );
}
