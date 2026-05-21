import { useState, useEffect } from 'react';

export default function SessionBar({ session, onClose, onCashMove }) {
  const [elapsed, setElapsed] = useState('');
  const [showMoves, setShowMoves] = useState(false);

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

  const salesTotal = session.sales?.total || 0;
  const cashMovesIn = (session.cash_moves || [])
    .filter(m => m.type === 'in')
    .reduce((s, m) => s + Number(m.amount), 0);
  const cashMovesOut = (session.cash_moves || [])
    .filter(m => m.type === 'out')
    .reduce((s, m) => s + Number(m.amount), 0);
  const drawerBalance = Number(session.opening_cash || 0) + salesTotal + cashMovesIn - cashMovesOut;

  return (
    <div className="relative flex items-center justify-between bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 mb-2 text-sm">
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <span className="font-medium text-primary-900">Session #{session.id}</span>
        <span className="text-primary-700">{elapsed}</span>
        <span className="text-primary-600">Opened: {new Intl.NumberFormat().format(Number(session.opening_cash || 0).toFixed(2))}</span>
        <span className="text-primary-800 font-semibold border-l border-primary-300 pl-3">
          Drawer: {new Intl.NumberFormat().format(drawerBalance.toFixed(2))}
        </span>
        {salesTotal > 0 && (
          <span className="text-primary-500">Sales: {new Intl.NumberFormat().format(salesTotal.toFixed(2))}</span>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setShowMoves(!showMoves)}
          className="px-2 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
        >
          {showMoves ? 'Hide' : 'Moves'}
        </button>
        <button onClick={() => onCashMove('in')} className="px-2 py-1 text-xs border border-green-300 text-green-700 rounded hover:bg-green-50">Cash In</button>
        <button onClick={() => onCashMove('out')} className="px-2 py-1 text-xs border border-red-300 text-red-700 rounded hover:bg-red-50">Cash Out</button>
        <button onClick={onClose} className="px-3 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700">Close Session</button>
      </div>

      {showMoves && session.cash_moves && session.cash_moves.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-white border rounded-lg shadow-lg p-3 text-xs max-h-48 overflow-y-auto">
          <p className="font-medium mb-1">Cash Moves</p>
          {session.cash_moves.map((m, i) => (
            <div key={i} className="flex justify-between py-1 border-b last:border-0">
              <span>
                <span className={m.type === 'in' ? 'text-green-600' : 'text-red-600'}>
                  {m.type === 'in' ? '+' : '-'}
                </span>
                {new Intl.NumberFormat().format(Number(m.amount).toFixed(2))}
                <span className="text-gray-400 ml-2">{m.reason}</span>
              </span>
              <span className="text-gray-400">{new Date(m.created_at).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
