import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirm', message = 'Are you sure?', confirmText = 'Confirm', variant = 'danger' }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={variant} onClick={onConfirm}>{confirmText}</Button>
      </div>
    </Modal>
  );
}
