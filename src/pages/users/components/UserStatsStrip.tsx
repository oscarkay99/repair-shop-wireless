import type { SystemUser } from '@/mocks/users';

interface UserStatsStripProps {
  users: SystemUser[];
}

export default function UserStatsStrip({ users }: UserStatsStripProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
      {[
        { label: 'Total Users', value: `${users.length}`, color: '#DC1F1F' },
        { label: 'Active', value: `${users.filter(u => u.status === 'active').length}`, color: '#25D366' },
        { label: 'Admins', value: `${users.filter(u => u.role === 'admin').length}`, color: '#DC1F1F' },
        { label: 'Sales Team', value: `${users.filter(u => u.role === 'sales_rep' || u.role === 'sales_manager').length}`, color: '#F59E0B' },
        { label: 'Technicians', value: `${users.filter(u => u.role === 'technician').length}`, color: '#E05A2B' },
      ].map(s => (
        <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100">
          <p className="text-xs text-slate-400 mb-1">{s.label}</p>
          <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}
