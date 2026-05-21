import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Modal from '../components/ui/Modal';
import CustomerForm from '../components/customers/CustomerForm';
import { useAuth } from '../context/AuthContext';

export default function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const load = () => {
    setLoading(true);
    api.get('/customers', { params: { search, page, limit: 20 } })
      .then((r) => { setCustomers(r.data.data); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, search]);

  const handleSave = async (data) => {
    try {
      if (editing) await api.put(`/customers/${editing.id}`, data);
      else await api.post('/customers', data);
      setShowForm(false); setEditing(null); load();
    } catch (err) { alert(err.response?.data?.error || 'Save failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/customers/${confirmDelete.id}`); setConfirmDelete(null); load(); }
    catch (err) { alert(err.response?.data?.error || 'Delete failed'); }
  };

  const handleExport = async () => {
    const { data } = await api.get('/export/customers');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'customers-export.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const items = JSON.parse(text);
      if (!Array.isArray(items)) throw new Error('File must contain an array');
      if (!confirm(`Import ${items.length} customers?`)) return;
      setImporting(true);
      const { data } = await api.post('/import/customers', { items, overwrite: true });
      alert(`Imported: ${data.imported} new, ${data.updated} updated${data.errors ? `, ${data.errors.length} errors` : ''}`);
      load();
    } catch (err) {
      alert('Import failed: ' + err.message);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'is_walk_in', label: 'Type', render: (v) => v ? 'Walk-in' : 'Registered' },
    { key: 'loyalty_points', label: 'Points', render: (v) => v ? `${v} pts` : '0' },
    { key: 'credit_limit', label: 'Credit Limit', render: (v) => new Intl.NumberFormat().format(v) },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => { setEditing(row); setShowForm(true); }}>Edit</Button>
          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setConfirmDelete(row)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={`Customers (${total})`}
        actions={
          <>
            <Input placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-48" />
            {user?.role === 'admin' && (
              <>
                <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
                <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={importing}>{importing ? 'Importing...' : 'Import'}</Button>
                <Button variant="secondary" onClick={handleExport}>Export</Button>
              </>
            )}
            <Button onClick={() => { setEditing(null); setShowForm(true); }}>Add Customer</Button>
          </>
        }
      >
        <Table columns={columns} data={customers} loading={loading} />
        <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
      </Card>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null); }} title={editing ? 'Edit Customer' : 'New Customer'}>
        <CustomerForm initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
      </Modal>

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="Delete Customer" message={`Delete "${confirmDelete?.name}"? This cannot be undone.`} />
    </div>
  );
}
