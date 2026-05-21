import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import api from '../../services/api';

const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'gcash', label: 'GCash' },
  { value: 'other', label: 'Other' },
];

export default function PaymentModal({ open, onClose, total, customerId, onComplete }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
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

  const change = Number(amount) - total;
  const pointsDiscount = usePoints ? Math.min(Number(redeemPoints) || 0, maxDiscount, total) : 0;
  const effectiveTotal = total - pointsDiscount;

  const handleSubmit = async () => {
    setProcessing(true);
    try {
      await onComplete({
        method,
        amount: Number(amount) || effectiveTotal,
        change: change > 0 ? change : 0,
        redeemPoints: pointsDiscount,
      });
    } finally {
      setProcessing(false);
      setAmount('');
      setUsePoints(false);
      setRedeemPoints('');
    }
  };

  const getQuickAmounts = () => {
    const base = Math.ceil(effectiveTotal / 10) * 10;
    return [base, base + 10, base + 20, base + 50, base + 100].filter(a => a > effectiveTotal);
  };

  return (
    <Modal open={open} onClose={onClose} title="Payment" size="sm">
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-sm text-gray-500">Total Amount</div>
          <div className="text-3xl font-bold text-gray-900">{new Intl.NumberFormat().format(effectiveTotal)}</div>
          {pointsDiscount > 0 && (
            <div className="text-xs text-green-600 mt-1">Includes -{new Intl.NumberFormat().format(pointsDiscount)} points discount</div>
          )}
        </div>

        <Select label="Payment Method" value={method} onChange={setMethod} options={paymentMethods} />

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

        {method === 'cash' && (
          <>
            <Input label="Amount Received" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
            {Number(amount) > 0 && (
              <div className="flex flex-wrap gap-1">
                {getQuickAmounts().map(a => (
                  <button key={a} onClick={() => setAmount(String(a))} className="px-3 py-1 text-xs border rounded hover:bg-gray-100">{a}</button>
                ))}
              </div>
            )}
            {Number(amount) >= effectiveTotal && (
              <div className="text-center">
                <span className="text-sm text-gray-500">Change: </span>
                <span className="text-xl font-bold text-green-600">{new Intl.NumberFormat().format(Number(amount) - effectiveTotal)}</span>
              </div>
            )}
          </>
        )}

        {method !== 'cash' && (
          <Input label="Amount" type="number" value={amount || effectiveTotal} onChange={(e) => setAmount(e.target.value)} />
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={processing || (method === 'cash' && Number(amount) < effectiveTotal)}>
            {processing ? 'Processing...' : 'Complete Payment'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
