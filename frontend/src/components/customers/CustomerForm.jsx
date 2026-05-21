import { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import api from '../../services/api';

export default function CustomerForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { name: '', email: '', phone: '', address: '', credit_limit: 0, notes: '', pricelist_id: '' });
  const [pricelists, setPricelists] = useState([]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    api.get('/pricelists').then((r) => setPricelists(r.data.data)).catch(() => {});
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, pricelist_id: form.pricelist_id ? Number(form.pricelist_id) : null });
  };

  const plOptions = [
    { value: '', label: 'None (default prices)' },
    ...pricelists.filter((p) => p.is_active).map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Name *" value={form.name} onChange={set('name')} required />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Email" type="email" value={form.email} onChange={set('email')} />
        <Input label="Phone" value={form.phone} onChange={set('phone')} />
      </div>
      <Input label="Address" value={form.address} onChange={set('address')} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Credit Limit" type="number" value={form.credit_limit} onChange={set('credit_limit')} />
        <Input label="Notes" value={form.notes} onChange={set('notes')} />
      </div>
      <Select label="Pricelist" value={form.pricelist_id} onChange={(v) => setForm({ ...form, pricelist_id: v })} options={plOptions} />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initial ? 'Update' : 'Create'} Customer</Button>
      </div>
    </form>
  );
}
