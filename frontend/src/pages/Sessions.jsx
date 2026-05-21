import { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Pagination from '../components/common/Pagination';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get('/pos/sessions', { params: { page, limit: 20 } })
      .then((r) => setSessions(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const viewDetail = async (s) => {
    const { data } = await api.get(`/pos/sessions/${s.id}`);
    setSelected(data);
  };

  const currency = (v) => new Intl.NumberFormat().format(Number(v || 0).toFixed(2));

  const columns = [
    { key: 'id', label: '#' },
    { key: 'user_name', label: 'Opened By' },
    { key: 'status', label: 'Status', render: (v) => <span className={`capitalize font-medium ${v === 'open' ? 'text-green-600' : 'text-gray-600'}`}>{v}</span> },
    { key: 'opening_cash', label: 'Opening', render: (v) => currency(v) },
    { key: 'sale_total', label: 'Sales', render: (v) => currency(v) },
    { key: 'expected_cash', label: 'Expected', render: (v) => v != null ? currency(v) : '-' },
    { key: 'difference', label: 'Diff', render: (v) => v != null ? <span className={v < 0 ? 'text-red-600' : v > 0 ? 'text-green-600' : ''}>{currency(v)}</span> : '-' },
    { key: 'opened_at', label: 'Opened', render: (v) => new Date(v).toLocaleString() },
    {
      key: 'actions', label: '',
      render: (_, row) => <Button size="sm" variant="ghost" onClick={() => viewDetail(row)}>View</Button>,
    },
  ];

  return (
    <div>
      <Card title={`POS Sessions (${sessions.length})`}>
        <Table columns={columns} data={sessions} loading={loading} onRowClick={viewDetail} />
        <Pagination page={page} total={sessions.length} limit={20} onPageChange={setPage} />
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Session #${selected?.id}`} size="xl">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500">Status</div>
                <div className="text-lg font-bold capitalize">{selected.status}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500">Opened By</div>
                <div className="text-lg font-bold">{selected.user_name}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500">Opened At</div>
                <div className="text-lg font-bold">{new Date(selected.opened_at).toLocaleString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="bg-primary-50 p-3 rounded-lg">
                <div className="text-xs text-primary-600">Opening Cash</div>
                <div className="text-lg font-bold">{currency(selected.opening_cash)}</div>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg">
                <div className="text-xs text-emerald-600">Sales Total</div>
                <div className="text-lg font-bold">{currency(selected.sales?.total)}</div>
              </div>
              <div className="bg-violet-50 p-3 rounded-lg">
                <div className="text-xs text-violet-600">Expected Cash</div>
                <div className="text-lg font-bold">{currency(selected.expected_cash)}</div>
              </div>
              <div className={selected.difference < 0 ? 'bg-red-50 p-3 rounded-lg' : 'bg-green-50 p-3 rounded-lg'}>
                <div className="text-xs">Difference</div>
                <div className="text-lg font-bold">{currency(selected.difference)}</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Cash Moves</h4>
              {selected.cash_moves?.length === 0 ? (
                <p className="text-sm text-gray-400">No cash moves</p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-gray-500"><th className="pb-1">Type</th><th className="pb-1">Amount</th><th className="pb-1">Reason</th><th className="pb-1">Time</th></tr></thead>
                  <tbody>
                    {selected.cash_moves?.map(m => (
                      <tr key={m.id} className="border-t">
                        <td className="py-1 capitalize">{m.type}</td>
                        <td className={`py-1 font-medium ${m.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>{currency(m.amount)}</td>
                        <td className="py-1">{m.reason}</td>
                        <td className="py-1">{new Date(m.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {selected.sales?.count > 0 && (
              <div>
                <h4 className="font-medium mb-2">Sales in Session: {selected.sales.count}</h4>
              </div>
            )}

            {selected.closed_at && (
              <div className="text-sm text-gray-500">Closed: {new Date(selected.closed_at).toLocaleString()}</div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
