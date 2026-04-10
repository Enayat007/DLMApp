'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { userService } from '@/lib/api/userService';
import { useAuth } from '@/lib/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import type { WorkspaceUser, UserRole } from '@/lib/types/user';

// ── Role badge ────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      role === 'Admin'
        ? 'bg-primary-100 text-primary-800'
        : 'bg-slate-100 text-slate-600'
    )}>
      {role}
    </span>
  );
}

// ── Add user modal ────────────────────────────────────────────────────────────

interface AddUserModalProps {
  open:    boolean;
  onClose: () => void;
  onAdded: (user: WorkspaceUser) => void;
}

function AddUserModal({ open, onClose, onAdded }: AddUserModalProps) {
  const [form, setForm]       = useState({ firstName: '', lastName: '', email: '', password: '', role: 'Viewer' as UserRole });
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [saving, setSaving]   = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors(p => { const n = { ...p }; delete n[field]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const user = await userService.create({ ...form, role: form.role as UserRole });
      toast.success(`${user.fullName} added to workspace.`);
      onAdded(user);
      onClose();
      setForm({ firstName: '', lastName: '', email: '', password: '', role: 'Viewer' });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; code?: string; errors?: Record<string, string[]> } } };
      const data = e.response?.data;
      if (data?.code === 'EMAIL_TAKEN') {
        setErrors({ email: data.message ?? 'Email already in use.' });
      } else if (data?.errors) {
        const mapped: Record<string, string> = {};
        for (const [k, msgs] of Object.entries(data.errors)) {
          const key = k.charAt(0).toLowerCase() + k.slice(1);
          mapped[key] = (msgs as string[])[0];
        }
        setErrors(mapped);
      } else {
        toast.error(data?.message ?? 'Failed to add user.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Add Team Member">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name" placeholder="Jane" value={form.firstName}
            onChange={set('firstName')} error={errors.firstName} required />
          <Input label="Last Name" placeholder="Smith" value={form.lastName}
            onChange={set('lastName')} error={errors.lastName} required />
        </div>
        <Input label="Email" type="email" placeholder="jane@hospital.org"
          value={form.email} onChange={set('email')} error={errors.email} required />
        <Input label="Password" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number"
          value={form.password} onChange={set('password')} error={errors.password} required />

        {/* Role selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
          <select
            value={form.role}
            onChange={set('role')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="Admin">Admin — full access</option>
            <option value="Viewer">Viewer — read only</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving && <Spinner size="sm" />}
            Add Member
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { user: currentUser } = useAuth();

  const [users,   setUsers]   = useState<WorkspaceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);

  useEffect(() => {
    userService.getAll()
      .then(setUsers)
      .catch(() => toast.error('Failed to load team members.'))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (user: WorkspaceUser, role: UserRole) => {
    try {
      const updated = await userService.updateRole(user.id, { role });
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      toast.success(`${updated.fullName}'s role updated to ${role}.`);
    } catch {
      toast.error('Failed to update role.');
    }
  };

  const handleDeactivate = async (user: WorkspaceUser) => {
    if (!confirm(`Deactivate ${user.fullName}? They will no longer be able to log in.`)) return;
    try {
      await userService.deactivate(user.id);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: false } : u));
      toast.success(`${user.fullName} has been deactivated.`);
    } catch {
      toast.error('Failed to deactivate user.');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Team Members</h1>
          <p className="text-slate-500 text-sm mt-1">Manage who has access to this workspace.</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Member
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Name</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Email</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Role</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className={clsx('hover:bg-slate-50', !u.isActive && 'opacity-50')}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center
                                        text-primary-700 font-semibold text-sm flex-shrink-0">
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-800">
                          {u.fullName}
                          {isSelf && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{u.email}</td>
                    <td className="px-6 py-4">
                      {isSelf || !u.isActive ? (
                        <RoleBadge role={u.role} />
                      ) : (
                        <select
                          value={u.role}
                          onChange={e => handleRoleChange(u, e.target.value as UserRole)}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white
                                     focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="Admin">Admin</option>
                          <option value="Viewer">Viewer</option>
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        u.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      )}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isSelf && u.isActive && (
                        <button
                          onClick={() => handleDeactivate(u)}
                          className="text-xs text-red-500 hover:text-red-700 hover:underline"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <AddUserModal
        open={modal}
        onClose={() => { setModal(false); }}
        onAdded={u => setUsers(prev => [...prev, u])}
      />
    </div>
  );
}
