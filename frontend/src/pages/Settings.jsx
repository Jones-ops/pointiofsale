import { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import LogoUpload from '../components/settings/LogoUpload';

export default function Settings() {
  const [form, setForm] = useState({});
  const [loyalty, setLoyalty] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingLoyalty, setSavingLoyalty] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/settings'),
      api.get('/loyalty/rules'),
    ]).then(([s, l]) => {
      setForm(s.data);
      setLoyalty(l.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setL = (k) => (e) => setLoyalty({ ...loyalty, [k]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/settings', form);
      setForm(data);
      alert('Settings saved');
    } catch (err) {
      alert(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleLoyaltySave = async () => {
    setSavingLoyalty(true);
    try {
      const { data } = await api.put('/loyalty/rules', {
        ...loyalty,
        points_per_currency: Number(loyalty.points_per_currency) || 1,
        min_order: Number(loyalty.min_order) || 0,
        max_discount_percent: Number(loyalty.max_discount_percent) || 100,
      });
      setLoyalty(data);
      alert('Loyalty rules saved');
    } catch (err) {
      alert(err.response?.data?.error || 'Save failed');
    } finally {
      setSavingLoyalty(false);
    }
  };

  const handleLogoUpload = async (formData) => {
    const { data } = await api.post('/settings/logo', formData);
    setForm((prev) => ({ ...prev, logo_path: data.logo_path }));
    return data;
  };

  const handleLogoDelete = async () => {
    await api.delete('/settings/logo');
    setForm((prev) => ({ ...prev, logo_path: '' }));
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <Card title="Company Settings">
        <form onSubmit={handleSave} className="max-w-xl space-y-4">
          <Input label="Company Name" value={form.company_name || ''} onChange={set('company_name')} required />
          <Input label="Address" value={form.address || ''} onChange={set('address')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" value={form.phone || ''} onChange={set('phone')} />
            <Input label="Email" type="email" value={form.email || ''} onChange={set('email')} />
          </div>
          <Input label="Tax ID" value={form.tax_id || ''} onChange={set('tax_id')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Currency Symbol" value={form.currency || '₱'} onChange={set('currency')} />
            <Input label="Tax Rate (%)" type="number" step="0.01" value={form.tax_rate || 0} onChange={set('tax_rate')} />
          </div>
          <LogoUpload currentPath={form.logo_path} onUpload={handleLogoUpload} onDelete={handleLogoDelete} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer</label>
            <textarea value={form.receipt_footer || ''} onChange={set('receipt_footer')} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
        </form>
      </Card>

      <Card title="Loyalty Points Rules">
        <div className="max-w-xl space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input label="Points per Currency" type="number" step="0.1" value={loyalty.points_per_currency || ''} onChange={setL('points_per_currency')} />
            <Input label="Min Order (0 = none)" type="number" value={loyalty.min_order || ''} onChange={setL('min_order')} />
            <Input label="Max Discount %" type="number" value={loyalty.max_discount_percent || ''} onChange={setL('max_discount_percent')} />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={loyalty.is_active} onChange={(e) => setLoyalty({ ...loyalty, is_active: e.target.checked ? 1 : 0 })} className="w-4 h-4" />
            <span className="text-sm">Loyalty program active</span>
          </label>
          <Button onClick={handleLoyaltySave} disabled={savingLoyalty}>{savingLoyalty ? 'Saving...' : 'Save Loyalty Rules'}</Button>
        </div>
      </Card>
    </div>
  );
}
