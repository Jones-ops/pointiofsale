import { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'staff' });

  const load = () => {
    setLoading(true);
    api.get('/users').then((r) => setUsers(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const payload = { name: form.name, role: form.role };
        if (form.password) payload.password = form.password;
        await api.put(`/users/${editing.id}`, payload);
      } else {
        await api.post('/users', form);
      }
      setShowForm(false); setEditing(null);
      setForm({ username: '', password: '', name: '', role: 'staff' });
      load();
    } catch (err) { alert(err.response?.data?.error || 'Save failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/users/${confirmDelete.id}`); setConfirmDelete(null); load(); }
    catch (err) { alert(err.response?.data?.error || 'Delete failed'); }
  };

  const editUser = (u) => {
    setEditing(u);
    setForm({ username: u.username, password: '', name: u.name, role: u.role });
    setShowForm(true);
  };

  const columns = [
    { key: 'username', label: 'Username' },
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role', render: (v) => <span className="capitalize">{v}</span> },
    { key: 'active', label: 'Active', render: (v) => v ? 'Yes' : 'No' },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => editUser(row)}>Edit</Button>
          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setConfirmDelete(row)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card title="User Management" actions={<Button onClick={() => { setEditing(null); setForm({ username: '', password: '', name: '', role: 'staff' }); setShowForm(true); }}>Add User</Button>}>
        <Table columns={columns} data={users} loading={loading} />
      </Card>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null); }} title={editing ? 'Edit User' : 'New User'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={!!editing} required />
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={editing ? 'New Password (leave blank to keep)' : 'Password'} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
            <Button type="submit">{editing ? 'Update' : 'Create'} User</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="Delete User" message={`Delete user "${confirmDelete?.username}"?`} />
    </div>
  );
}
