import React, { useEffect, useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import { userManagementService } from '../services/api';

const formatDate = (value) => value ? new Date(value).toLocaleDateString() : 'Not available';

const initialForm = {
  id: '',
  username: '',
  full_name: '',
  email: '',
  phone: '',
  role: '',
  is_active: true,
  password: ''
};

const UserModal = ({ mode, roles, user, onClose, onSaved }) => {
  const [form, setForm] = useState(user ? { ...initialForm, ...user } : initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');

  useEffect(() => {
    setForm(user ? { ...initialForm, ...user } : initialForm);
    setGeneratedPassword('');
  }, [user]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError('');
      if (mode === 'create') {
        const result = await userManagementService.createUser(form);
        setGeneratedPassword(result.password);
        onSaved?.('User created successfully.');
      } else {
        await userManagementService.updateUser(form.id, {
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          is_active: form.is_active
        });
        onSaved?.('User updated successfully.');
        onClose();
      }
    } catch (err) {
      setError(err.message || err.error || 'Could not save user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight">{mode === 'create' ? 'Create User' : 'Edit User'}</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Database-backed role and access management</p>
          </div>
          <button type="button" onClick={onClose} className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500">X</button>
        </div>
        <form onSubmit={submit} className="p-6 md:p-8 space-y-5">
          {error && <div className="rounded-2xl bg-rose-50 border border-rose-100 px-5 py-3 text-sm font-bold text-rose-700">{error}</div>}
          {generatedPassword && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-5 py-3 text-sm font-bold text-emerald-700">
              Generated password: <span className="font-black">{generatedPassword}</span>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Username</span>
              <input disabled={mode !== 'create'} required value={form.username || ''} onChange={e => setForm(current => ({ ...current, username: e.target.value }))} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none disabled:opacity-60" />
            </label>
            <label className="block">
              <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Full Name</span>
              <input value={form.full_name || ''} onChange={e => setForm(current => ({ ...current, full_name: e.target.value }))} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none" />
            </label>
            <label className="block">
              <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Email</span>
              <input type="email" value={form.email || ''} onChange={e => setForm(current => ({ ...current, email: e.target.value }))} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none" />
            </label>
            <label className="block">
              <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Phone</span>
              <input value={form.phone || ''} onChange={e => setForm(current => ({ ...current, phone: e.target.value }))} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none" />
            </label>
            <label className="block">
              <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Role</span>
              <select required value={form.role || ''} onChange={e => setForm(current => ({ ...current, role: e.target.value }))} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none">
                <option value="">Select role</option>
                {roles.map(role => <option key={role.role_name} value={role.role_name}>{role.role_name}</option>)}
              </select>
            </label>
            {mode === 'create' && (
              <label className="block">
                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Password</span>
                <input placeholder="Leave blank to auto-generate" value={form.password || ''} onChange={e => setForm(current => ({ ...current, password: e.target.value }))} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none" />
              </label>
            )}
          </div>

          <label className="flex items-center gap-3">
            <input type="checkbox" checked={Boolean(form.is_active)} onChange={e => setForm(current => ({ ...current, is_active: e.target.checked }))} />
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Active account</span>
          </label>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[11px] font-black uppercase tracking-widest">Close</button>
            <button type="submit" disabled={saving} className="px-5 py-3 rounded-2xl bg-primary-600 text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-50">{saving ? 'Saving...' : 'Save User'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UserManagement = ({ user, setIsSidebarOpen }) => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [filters, setFilters] = useState({ search: '', role: '', status: '' });
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const loadRoles = async () => {
      try {
        const data = await userManagementService.getRoles();
        if (isMounted) setRoles(data || []);
      } catch (err) {
        if (isMounted) setError(err.message || err.error || 'Could not load roles');
      }
    };
    loadRoles();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await userManagementService.getUsers(filters);
        if (isMounted) setUsers(data || []);
      } catch (err) {
        if (isMounted) setError(err.message || err.error || 'Could not load users');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    const timeout = setTimeout(loadUsers, 250);
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [filters, refreshKey]);

  const saveDone = (nextMessage) => {
    setMessage(nextMessage);
    setRefreshKey(current => current + 1);
  };

  const resetUserPassword = async (targetUser) => {
    try {
      setError('');
      setMessage('');
      const result = await userManagementService.resetPassword(targetUser.id);
      setResetPassword(`New password for ${targetUser.username}: ${result.password}`);
      setRefreshKey(current => current + 1);
    } catch (err) {
      setError(err.message || err.error || 'Could not reset password');
    }
  };

  return (
    <div className="p-6 md:p-10 min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminHeader title="User Management" subtitle="Role-based system users and access control" setIsOpen={setIsSidebarOpen} user={user} />

      {error && <div className="mb-6 rounded-2xl border border-rose-100 bg-rose-50 px-6 py-4 text-sm font-bold text-rose-700">{error}</div>}
      {message && <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-6 py-4 text-sm font-bold text-emerald-700">{message}</div>}
      {resetPassword && <div className="mb-6 rounded-2xl border border-amber-100 bg-amber-50 px-6 py-4 text-sm font-bold text-amber-700">{resetPassword}</div>}

      <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-premium overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col xl:flex-row gap-4 xl:items-end xl:justify-between">
          <div className="grid sm:grid-cols-3 gap-4 flex-1">
            <label>
              <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Search</span>
              <input value={filters.search} onChange={e => setFilters(current => ({ ...current, search: e.target.value }))} placeholder="Name, username, email" className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none" />
            </label>
            <label>
              <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Role</span>
              <select value={filters.role} onChange={e => setFilters(current => ({ ...current, role: e.target.value }))} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none">
                <option value="">All roles</option>
                {roles.map(role => <option key={role.role_name} value={role.role_name}>{role.role_name}</option>)}
              </select>
            </label>
            <label>
              <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Status</span>
              <select value={filters.status} onChange={e => setFilters(current => ({ ...current, status: e.target.value }))} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none">
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
          <button onClick={() => setModal({ mode: 'create', user: null })} className="px-5 py-3.5 rounded-2xl bg-primary-600 text-white text-[11px] font-black uppercase tracking-widest">Create User</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/40">
              <tr>
                {['Full Name', 'Username', 'Email', 'Phone', 'Role', 'Status', 'Created Date', 'Actions'].map(header => (
                  <th key={header} className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="8" className="py-20 text-center text-sm font-black text-slate-400 uppercase tracking-widest">Loading users</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="8" className="py-20 text-center text-sm font-bold text-slate-400">No users match this query.</td></tr>
              ) : users.map(item => (
                <tr key={item.id}>
                  <td className="px-6 py-5 text-sm font-black text-slate-900 dark:text-white">{item.full_name}</td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-500">{item.username}</td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-500">{item.email || '-'}</td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-500">{item.phone || '-'}</td>
                  <td className="px-6 py-5 text-sm font-black text-slate-700 dark:text-slate-200">{item.role}</td>
                  <td className="px-6 py-5 text-sm font-black">{item.is_active ? 'Active' : 'Inactive'}</td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-500">{formatDate(item.created_at)}</td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setModal({ mode: 'edit', user: item })} className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest">Edit</button>
                      <button onClick={() => userManagementService.updateUser(item.id, { is_active: !item.is_active }).then(() => saveDone(item.is_active ? 'User deactivated.' : 'User activated.')).catch(err => setError(err.message || err.error || 'Could not update status'))} className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest">
                        {item.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => resetUserPassword(item)} className="px-3 py-2 rounded-xl bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest">Reset</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modal && (
        <UserModal
          mode={modal.mode}
          roles={roles}
          user={modal.user}
          onClose={() => setModal(null)}
          onSaved={saveDone}
        />
      )}
    </div>
  );
};

export default UserManagement;
