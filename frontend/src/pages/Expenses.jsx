import { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Modal from '../components/ui/Modal';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ category: '', description: '', amount: '', expense_date: new Date().toISOString().split('T')[0] });

  const load = () => {
    setLoading(true);
    api.get('/expenses', { params: { page, limit: 20 } })
      .then((r) => { setExpenses(r.data.data); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/expenses/${editing.id}`, form);
      else await api.post('/expenses', form);
      setShowForm(false); setEditing(null);
      setForm({ category: '', description: '', amount: '', expense_date: new Date().toISOString().split('T')[0] });
      load();
    } catch (err) { alert(err.response?.data?.error || 'Save failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/expenses/${confirmDelete.id}`); setConfirmDelete(null); load(); }
    catch (err) { alert(err.response?.data?.error || 'Delete failed'); }
  };

  const editExpense = (exp) => {
    setEditing(exp);
    setForm({ category: exp.category, description: exp.description || '', amount: String(exp.amount), expense_date: exp.expense_date });
    setShowForm(true);
  };

  const currency = (v) => new Intl.NumberFormat().format(Number(v));

  const columns = [
    { key: 'category', label: 'Category' },
    { key: 'description', label: 'Description' },
    { key: 'amount', label: 'Amount', render: (v) => currency(v) },
    { key: 'expense_date', label: 'Date' },
    { key: 'staff_name', label: 'Recorded By' },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => editExpense(row)}>Edit</Button>
          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setConfirmDelete(row)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card title={`Expenses (${total})`} actions={<Button onClick={() => { setEditing(null); setForm({ category: '', description: '', amount: '', expense_date: new Date().toISOString().split('T')[0] }); setShowForm(true); }}>Add Expense</Button>}>
        <Table columns={columns} data={expenses} loading={loading} />
        <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
      </Card>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null); }} title={editing ? 'Edit Expense' : 'New Expense'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Category *" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Amount *" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            <Input label="Date *" type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
            <Button type="submit">{editing ? 'Update' : 'Create'} Expense</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="Delete Expense" message={`Delete expense of ${currency(confirmDelete?.amount)}?`} />
    </div>
  );
}
