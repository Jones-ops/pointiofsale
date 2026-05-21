import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

export default function CashMoveModal({ open, onClose, onConfirm, defaultType }) {
  const [type, setType] = useState(defaultType || 'in');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm({ type, amount: Number(amount), reason });
  };

  return (
    <Modal open={open} onClose={onClose} title={`Cash ${type === 'in' ? 'In' : 'Out'}`} size="sm">
      <div className="space-y-4">
        <Select
          label="Type"
          value={type}
          onChange={setType}
          options={[
            { value: 'in', label: 'Cash In (add to drawer)' },
            { value: 'out', label: 'Cash Out (remove from drawer)' },
          ]}
        />
        <Input label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        <Input label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Safe drop, change fund..." />
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleConfirm} disabled={!amount || amount <= 0 || !reason}>
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
}
