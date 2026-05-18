import { useState, useEffect } from 'react';
import AdminLayout from '@/components/feature/AdminLayout';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/shared/Pagination';
import { rolePermissions } from '@/mocks/users';
import type { SystemUser } from '@/mocks/users';
import type { UserRole } from '@/hooks/useAuth';
import UserStatsStrip from './components/UserStatsStrip';
import UserTable from './components/UserTable';
import UserDetailPanel from './components/UserDetailPanel';
import UserFormModal from './components/UserFormModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import { systemUsers as seedUsers } from '@/mocks/users';

const emptyUser: Omit<SystemUser, 'id' | 'createdAt' | 'lastLogin'> = {
  name: '', email: '', role: 'sales_rep', avatar: '', status: 'active', phone: '',
  permissions: rolePermissions.sales_rep,
};

export default function UsersPage() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<SystemUser> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => { setUsers([...seedUsers]); setLoading(false); }, []);

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });
  const { paginated, page, setPage, totalPages, total, from, to } = usePagination(filtered, 15, `${search}|${filterRole}`);
  const selected = users.find(u => u.id === selectedUser);

  const openAddModal = () => {
    setEditingUser({ ...emptyUser });
    setPassword('');
    setSaveError(null);
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (user: SystemUser) => {
    setEditingUser({ ...user });
    setSaveError(null);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleRoleChange = (role: UserRole) => {
    setEditingUser(prev => prev ? { ...prev, role, permissions: [...rolePermissions[role]] } : prev);
  };

  const togglePermission = (perm: string) => {
    setEditingUser(prev => {
      if (!prev) return prev;
      const perms = prev.permissions || [];
      return { ...prev, permissions: perms.includes(perm) ? perms.filter(p => p !== perm) : [...perms, perm] };
    });
  };

  const handleFieldChange = (field: keyof SystemUser, value: string) => {
    setEditingUser(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleSave = async () => {
    if (!editingUser?.name || !editingUser?.email) return;
    setSaving(true);
    setSaveError(null);

    if (isEditing && editingUser.id) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...editingUser } as SystemUser : u));
    } else {
      if (!password) { setSaveError('Password is required'); setSaving(false); return; }
      setUsers(prev => [...prev, {
        ...emptyUser, ...editingUser,
        id: `U${String(prev.length + 1).padStart(3, '0')}`,
        avatar: editingUser.name!.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        createdAt: new Date().toLocaleDateString('en-GH', { month: 'short', day: 'numeric', year: 'numeric' }),
        lastLogin: 'Never',
      } as SystemUser]);
    }

    setSaving(false);
    setShowModal(false);
    setEditingUser(null);
  };

  const handleDelete = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    if (selectedUser === id) setSelectedUser(null);
    setShowDeleteConfirm(null);
  };

  const toggleStatus = (id: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    const next = user.status === 'active' ? 'inactive' : 'active';
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: next } : u));
  };

  return (
    <AdminLayout title="User Management" subtitle="Add users · Assign roles · Control access">
      <UserStatsStrip users={users} />

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
          <i className="ri-loader-4-line animate-spin mr-2" />Loading users…
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <UserTable
            filtered={paginated}
            selectedUser={selectedUser}
            onSelect={id => setSelectedUser(selectedUser === id ? null : id)}
            onEdit={openEditModal}
            onDelete={id => setShowDeleteConfirm(id)}
            onToggleStatus={toggleStatus}
            search={search}
            onSearch={setSearch}
            filterRole={filterRole}
            onFilterRole={setFilterRole}
            onAddUser={openAddModal}
          />
          <UserDetailPanel user={selected} onEdit={openEditModal} onToggleStatus={toggleStatus} />
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} from={from} to={to} onPageChange={setPage} />

      <UserFormModal
        open={showModal}
        isEditing={isEditing}
        editingUser={editingUser}
        password={password}
        onPasswordChange={setPassword}
        saving={saving}
        saveError={saveError}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        onRoleChange={handleRoleChange}
        onTogglePermission={togglePermission}
        onFieldChange={handleFieldChange}
      />

      <DeleteConfirmModal
        userId={showDeleteConfirm}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(null)}
      />
    </AdminLayout>
  );
}
