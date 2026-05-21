import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function SessionClose({ open, session, onClose, onConfirm, loading }) {
  const [closingCash, setClosingCash] = useState('');
  const [notes, setNotes] = useState('');

  const expected = Number(session?.expected_cash || 0);

  const handleConfirm = () => {
    onConfirm(Number(closingCash) || 0, notes);
  };

  const diff = (Number(closingCash) || 0) - expected;

  return (
    <Modal open={open} onClose={onClose} title={`Close Session #${session?.id}`} size="sm">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <div className="text-xs text-gray-500">Opening Cash</div>
            <div className="text-lg font-bold">{new Intl.NumberFormat().format(Number(session?.opening_cash || 0).toFixed(2))}</div>
          </div>
          <div className="bg-primary-50 p-3 rounded-lg text-center">
            <div className="text-xs text-primary-600">Expected Cash</div>
            <div className="text-lg font-bold">{new Intl.NumberFormat().format(expected.toFixed(2))}</div>
          </div>
        </div>

        <Input label="Actual Cash in Drawer" type="number" value={closingCash} onChange={(e) => setClosingCash(e.target.value)} autoFocus />

        {Number(closingCash) > 0 && (
          <div className={`text-center p-2 rounded-lg ${diff === 0 ? 'bg-green-50 text-green-700' : diff > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {diff === 0 ? 'Perfect match!' : diff > 0 ? `Over by ${new Intl.NumberFormat().format(diff.toFixed(2))}` : `Short by ${new Intl.NumberFormat().format(Math.abs(diff).toFixed(2))}`}
          </div>
        )}

        <Input label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleConfirm} disabled={loading || !closingCash}>
            {loading ? 'Closing...' : 'Close Session'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
