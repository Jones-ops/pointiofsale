import { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

export default function Pricelists() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editList, setEditList] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'sale' });

  const load = () => {
    setLoading(true);
    api.get('/pricelists').then((r) => setLists(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openEdit = async (pl) => {
    const { data } = await api.get(`/pricelists/${pl.id}`);
    setEditList(data);
    setShowForm(true);
    setForm({ name: data.name, type: data.type });
  };

  const saveList = async () => {
    if (editList) {
      await api.put(`/pricelists/${editList.id}`, form);
    } else {
      await api.post('/pricelists', form);
    }
    setShowForm(false);
    setEditList(null);
    load();
  };

  const deleteList = async (id) => {
    if (!confirm('Delete this pricelist?')) return;
    await api.delete(`/pricelists/${id}`);
    load();
  };

  const addItem = async () => {
    const priceType = prompt('Price type: fixed, discount_percent, or markup_percent?');
    if (!priceType) return;
    const priceValue = prompt('Value:');
    if (!priceValue) return;
    const scope = prompt('Scope: product_id, category_id, or leave blank for all');
    const scopeId = scope ? prompt(`${scope}:`) : null;
    await api.post(`/pricelists/${editList.id}/items`, {
      price_type: priceType,
      price_value: Number(priceValue),
      ...(scope && scopeId ? { [scope]: Number(scopeId) } : {}),
    });
    const { data } = await api.get(`/pricelists/${editList.id}`);
    setEditList(data);
  };

  const deleteItem = async (itemId) => {
    if (!confirm('Delete this item?')) return;
    await api.delete(`/pricelists/items/${itemId}`);
    const { data } = await api.get(`/pricelists/${editList.id}`);
    setEditList(data);
  };

  return (
    <div>
      <Card title="Pricelists" actions={<Button onClick={() => { setEditList(null); setForm({ name: '', type: 'sale' }); setShowForm(true); }}>Add Pricelist</Button>}>
        {loading ? (
          <div className="text-center text-sm text-gray-500 py-8">Loading...</div>
        ) : lists.length === 0 ? (
          <div className="text-center text-sm text-gray-400 py-8">No pricelists yet</div>
        ) : (
          <div className="space-y-3">
            {lists.map((pl) => (
              <div key={pl.id} className="border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{pl.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{pl.type} &middot; {pl.item_count} item(s) &middot; {pl.is_active ? 'Active' : 'Inactive'}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(pl)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteList(pl.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditList(null); }} title={editList ? `Edit: ${editList.name}` : 'New Pricelist'} size="lg">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select label="Type" value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={[{ value: 'sale', label: 'Sale' }]} />
          <div className="flex gap-3">
            <Button onClick={saveList} disabled={!form.name}>Save</Button>
            <Button variant="secondary" onClick={() => { setShowForm(false); setEditList(null); }}>Cancel</Button>
          </div>

          {editList && (
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">Price Rules</h4>
                <Button size="sm" onClick={addItem}>Add Rule</Button>
              </div>
              {editList.items?.length === 0 ? (
                <p className="text-sm text-gray-400">No rules yet</p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-gray-500"><th className="pb-2">Type</th><th className="pb-2">Value</th><th className="pb-2">Scope</th><th className="pb-2">Min Qty</th><th className="pb-2">Priority</th><th className="pb-2"></th></tr></thead>
                  <tbody>
                    {editList.items?.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="py-1 capitalize">{item.price_type.replace(/_/g, ' ')}</td>
                        <td className="py-1">{item.price_value}{item.price_type === 'discount_percent' || item.price_type === 'markup_percent' ? '%' : ''}</td>
                        <td className="py-1">{item.product_name || item.category_name || 'All Products'}</td>
                        <td className="py-1">{item.min_quantity}</td>
                        <td className="py-1">{item.priority}</td>
                        <td className="py-1"><Button size="sm" variant="ghost" onClick={() => deleteItem(item.id)}>Remove</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
