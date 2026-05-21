import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import api from '../../services/api';

export default function ReturnModal({ open, sale, onClose, onComplete }) {
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sale) {
      setItems(sale.items?.map(i => ({ ...i, returnQty: 0, reason: '' })) || []);
      setError('');
    }
  }, [sale]);

  const total = items.reduce((s, i) => s + (i.unit_price * i.returnQty), 0);

  const handleSubmit = async () => {
    const selected = items.filter(i => i.returnQty > 0);
    if (!selected.length) { setError('Select at least one item to return'); return; }
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post(`/sales/${sale.id}/return`, {
        items: selected.map(i => ({ sale_item_id: i.id, quantity: i.returnQty, reason: i.reason })),
      });
      const pdfRes = await api.get(`/sales/${data.id}/receipt`, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(pdfRes.data);
      window.open(blobUrl, '_blank');
      onComplete(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Return failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Return: ${sale?.receipt_no}`} size="lg">
      <div className="space-y-3">
        <p className="text-sm text-gray-500">Select items and quantities to return</p>
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">{error}</div>}

        {items.map((item, idx) => (
          <div key={item.id} className="border rounded-lg p-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={item.returnQty > 0}
                onChange={(e) => {
                  const updated = [...items];
                  updated[idx] = { ...updated[idx], returnQty: e.target.checked ? item.quantity : 0 };
                  setItems(updated);
                }}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <div className="font-medium text-sm">{item.product_name}</div>
                <div className="text-xs text-gray-500">{new Intl.NumberFormat().format(item.unit_price)} x {item.quantity}</div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={item.returnQty || ''}
                  onChange={(e) => {
                    const updated = [...items];
                    updated[idx] = { ...updated[idx], returnQty: Math.min(Number(e.target.value) || 0, item.quantity) };
                    setItems(updated);
                  }}
                  className="w-20 text-center"
                  min={0}
                  max={item.quantity}
                />
                <span className="text-xs text-gray-400">/ {item.quantity}</span>
              </div>
            </div>
            {item.returnQty > 0 && (
              <input
                type="text"
                placeholder="Reason for return"
                value={item.reason}
                onChange={(e) => {
                  const updated = [...items];
                  updated[idx] = { ...updated[idx], reason: e.target.value };
                  setItems(updated);
                }}
                className="mt-2 w-full text-sm px-3 py-1.5 border rounded"
              />
            )}
          </div>
        ))}

        {total > 0 && (
          <div className="text-right text-lg font-bold">
            Return Total: {new Intl.NumberFormat().format(total.toFixed(2))}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={saving || !items.some(i => i.returnQty > 0)}>
            {saving ? 'Processing...' : 'Process Return'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
