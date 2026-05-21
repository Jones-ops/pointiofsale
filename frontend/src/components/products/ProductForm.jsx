import { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import api from '../../services/api';

export default function ProductForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    sku: '', name: '', description: '', category_id: '', cost_price: 0,
    selling_price: 0, unit: 'pcs', stock: 0, reorder_level: 0, barcode: '',
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const catOptions = [{ value: '', label: 'No Category' }, ...categories.map(c => ({ value: c.id, label: c.name }))];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, category_id: form.category_id ? Number(form.category_id) : null });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="SKU *" value={form.sku} onChange={set('sku')} required />
        <Input label="Name *" value={form.name} onChange={set('name')} required />
      </div>
      <Input label="Description" value={form.description} onChange={set('description')} />
      <div className="grid grid-cols-2 gap-4">
        <Select label="Category" value={form.category_id} onChange={(v) => setForm({ ...form, category_id: v })} options={catOptions} />
        <Input label="Unit" value={form.unit} onChange={set('unit')} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input label="Cost Price" type="number" step="0.01" value={form.cost_price} onChange={set('cost_price')} />
        <Input label="Selling Price" type="number" step="0.01" value={form.selling_price} onChange={set('selling_price')} />
        <Input label="Barcode" value={form.barcode} onChange={set('barcode')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Stock" type="number" value={form.stock} onChange={set('stock')} />
        <Input label="Reorder Level" type="number" value={form.reorder_level} onChange={set('reorder_level')} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initial ? 'Update' : 'Create'} Product</Button>
      </div>
    </form>
  );
}
