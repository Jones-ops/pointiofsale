import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LogoUpload from '../components/settings/LogoUpload';

const steps = ['Company Info', 'Finances', 'Logo', 'Receipt', 'Confirm'];

export default function SetupWizard() {
  const { user, refreshSetup } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: '', address: '', phone: '', email: '', tax_id: '',
    currency: '₱', tax_rate: 0, receipt_footer: 'Thank you for your purchase!',
  });
  const [logoPath, setLogoPath] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleUpload = async (formData) => {
    const { data } = await api.post('/settings/logo', formData);
    setLogoPath(data.logo_path);
    return data;
  };

  const handleDeleteLogo = async () => {
    await api.delete('/settings/logo');
    setLogoPath('');
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await api.put('/settings', { ...form, setup_complete: 1 });
      await refreshSetup();
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center">Access denied. Admin only.</div>;
  }

  const canNext = () => {
    if (step === 0) return form.company_name.trim();
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Welcome to POS System</h1>
          <p className="text-sm text-gray-500 mt-1">Let's set up your company</p>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-1 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${i === step ? 'bg-primary-600 text-white' : i < step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`w-8 h-0.5 ${i < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 0: Company Info */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Company Information</h2>
            <Input label="Company Name *" value={form.company_name} onChange={set('company_name')} autoFocus placeholder="e.g. Acme Corp" />
            <Input label="Address" value={form.address} onChange={set('address')} placeholder="123 Main St, City" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="+1 234 567 890" />
              <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="info@company.com" />
            </div>
            <Input label="Tax ID" value={form.tax_id} onChange={set('tax_id')} placeholder="TIN-123456789" />
          </div>
        )}

        {/* Step 1: Finances */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Financial Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Currency Symbol" value={form.currency} onChange={set('currency')} placeholder="₱" />
              <Input label="Tax Rate (%)" type="number" step="0.01" min="0" max="100" value={form.tax_rate} onChange={set('tax_rate')} />
            </div>
          </div>
        )}

        {/* Step 2: Logo */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Company Logo</h2>
            <p className="text-sm text-gray-500">Upload your company logo to appear on receipts (optional)</p>
            <LogoUpload currentPath={logoPath} onUpload={handleUpload} onDelete={handleDeleteLogo} />
          </div>
        )}

        {/* Step 3: Receipt */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Receipt Settings</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer Message</label>
              <textarea value={form.receipt_footer} onChange={set('receipt_footer')} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Thank you for your purchase!" />
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-xs">
              <p className="font-medium mb-2">Receipt Preview:</p>
              <div className="border bg-white p-3 rounded text-center">
                {logoPath && <img src={`${logoPath}?t=${Date.now()}`} className="mx-auto max-h-10 mb-1" alt="" />}
                <p className="font-bold">{form.company_name || 'Your Company'}</p>
                <p>{form.address}</p>
                <hr className="my-1" />
                <p className="font-bold">SALES RECEIPT</p>
                <p className="text-gray-400 mt-1">{form.receipt_footer}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Confirm Settings</h2>
            <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-gray-500">Company:</span><span className="font-medium">{form.company_name}</span>
                <span className="text-gray-500">Address:</span><span>{form.address || '—'}</span>
                <span className="text-gray-500">Phone:</span><span>{form.phone || '—'}</span>
                <span className="text-gray-500">Email:</span><span>{form.email || '—'}</span>
                <span className="text-gray-500">Tax ID:</span><span>{form.tax_id || '—'}</span>
                <span className="text-gray-500">Currency:</span><span>{form.currency}</span>
                <span className="text-gray-500">Tax Rate:</span><span>{form.tax_rate}%</span>
                <span className="text-gray-500">Logo:</span><span>{logoPath ? 'Uploaded' : 'None'}</span>
              </div>
              <hr />
              <div>
                <span className="text-gray-500">Receipt Footer:</span>
                <p className="italic mt-1">{form.receipt_footer}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center">You can change all settings later from the Settings page.</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={() => step > 0 ? setStep(step - 1) : navigate('/')}>
            {step === 0 ? 'Skip Setup' : 'Back'}
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>Continue</Button>
          ) : (
            <Button onClick={handleFinish} disabled={saving}>{saving ? 'Saving...' : 'Complete Setup'}</Button>
          )}
        </div>
      </div>
    </div>
  );
}
