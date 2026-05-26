import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import api from '../../services/api';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'gcash', label: 'GCash' },
  { value: 'other', label: 'Other' },
];

export default function PaymentModal({ open, onClose, total, customerId, onComplete }) {
  const [payments, setPayments] = useState([{ method: 'cash', amount: '' }]);
  const [processing, setProcessing] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState('');
  const [pointsBalance, setPointsBalance] = useState(0);
  const [maxDiscount, setMaxDiscount] = useState(0);

  useEffect(() => {
    if (open && customerId) {
      api.get('/loyalty/transactions', { params: { customer_id: customerId } })
        .then((r) => {
          setPointsBalance(r.data.balance);
          setMaxDiscount(r.data.balance);
        })
        .catch(() => {});
    } else {
      setPointsBalance(0);
      setMaxDiscount(0);
      setUsePoints(false);
      setRedeemPoints('');
    }
  }, [open, customerId]);

  useEffect(() => {
    if (open) setPayments([{ method: 'cash', amount: '' }]);
  }, [open]);

  const pointsDiscount = usePoints ? Math.min(Number(redeemPoints) || 0, maxDiscount, total) : 0;
  const effectiveTotal = total - pointsDiscount;
  const allocated = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const remaining = Math.max(0, effectiveTotal - allocated);
  const overpaid = Math.max(0, allocated - effectiveTotal);

  const updatePayment = (idx, field, value) => {
    setPayments((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const addPayment = () => {
    setPayments((prev) => [...prev, { method: 'cash', amount: '' }]);
  };

  const removePayment = (idx) => {
    setPayments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setProcessing(true);
    try {
      const finalPayments = payments.map(p => ({
        method: p.method,
        amount: Number(p.amount) || remaining > 0 ? Number(p.amount) || 0 : 0,
      }));
      if (finalPayments.length === 0) {
        finalPayments.push({ method: 'cash', amount: effectiveTotal });
      }
      await onComplete({
        payments: finalPayments,
        redeemPoints: pointsDiscount,
      });
    } finally {
      setProcessing(false);
    }
  };

  const getQuickAmounts = () => {
    if (payments.length !== 1 || payments[0].method !== 'cash') return [];
    const base = Math.ceil(effectiveTotal / 10) * 10;
    return [base, base + 10, base + 20, base + 50, base + 100].filter(a => a > effectiveTotal);
  };

  const quickAmounts = getQuickAmounts();
  const canComplete = allocated >= effectiveTotal || payments.some(p => Number(p.amount) > 0);

  return (
    <Modal open={open} onClose={onClose} title="Payment" size="md">
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-sm text-gray-500">Total Amount</div>
          <div className="text-3xl font-bold text-gray-900">{new Intl.NumberFormat().format(effectiveTotal)}</div>
          {pointsDiscount > 0 && (
            <div className="text-xs text-green-600 mt-1">Includes -{new Intl.NumberFormat().format(pointsDiscount)} points discount</div>
          )}
        </div>

        {customerId && pointsBalance > 0 && (
          <div className="border rounded-lg p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm font-medium">Use Loyalty Points</span>
              <span className="text-xs text-gray-500 ml-auto">Balance: {pointsBalance} pts</span>
            </label>
            {usePoints && (
              <div className="mt-2">
                <Input
                  label={`Points to redeem (max ${Math.floor(maxDiscount)} = ${new Intl.NumberFormat().format(Math.floor(maxDiscount))})`}
                  type="number"
                  value={redeemPoints}
                  onChange={(e) => setRedeemPoints(e.target.value)}
                  max={Math.floor(maxDiscount)}
                />
                <div className="text-xs text-green-600 mt-1">Discount: -{new Intl.NumberFormat().format(pointsDiscount)}</div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Payments</label>
            <button onClick={addPayment} className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1">
              <PlusIcon className="w-3 h-3" /> Add payment
            </button>
          </div>
          {payments.map((p, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <div className="flex-1">
                <Select
                  value={p.method}
                  onChange={(v) => updatePayment(idx, 'method', v)}
                  options={paymentMethods}
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  value={p.amount}
                  onChange={(e) => updatePayment(idx, 'amount', e.target.value)}
                  placeholder="Amount"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  min="0"
                />
              </div>
              {payments.length > 1 && (
                <button onClick={() => removePayment(idx)} className="p-2 text-red-400 hover:text-red-600 mt-1">
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Remaining:</span>
          <span className={remaining > 0 ? 'text-orange-600 font-bold' : 'text-green-600 font-bold'}>
            {remaining > 0 ? new Intl.NumberFormat().format(remaining) : 'Paid in full'}
          </span>
        </div>

        {overpaid > 0 && (
          <div className="text-center text-sm text-green-700">
            Change: <span className="font-bold">{new Intl.NumberFormat().format(overpaid)}</span>
          </div>
        )}

        {payments.length === 1 && payments[0].method === 'cash' && (
          <>
            {quickAmounts.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {quickAmounts.map(a => (
                  <button key={a} onClick={() => updatePayment(0, 'amount', String(a))} className="px-3 py-1 text-xs border rounded hover:bg-gray-100">{a}</button>
                ))}
              </div>
            )}
          </>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={processing || (allocated < effectiveTotal && !payments.some(p => Number(p.amount) > 0))}>
            {processing ? 'Processing...' : 'Complete Payment'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
