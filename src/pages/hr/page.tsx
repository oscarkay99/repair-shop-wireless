import { useState } from 'react';
import AdminLayout from '@/components/feature/AdminLayout';
import { useAuth } from '@/hooks/useAuth';
import SettingsSidebar from '../settings/components/SettingsSidebar';
import StaffDirectory from './components/StaffDirectory';
import StaffDashboard from './components/StaffDashboard';
import LeaveApprovalQueue from './components/LeaveApprovalQueue';
import LeaveCalendar from './components/LeaveCalendar';
import { useStaffQueries } from '@/hooks/useStaffQueries';
import QueryThread from '@/components/shared/QueryThread';
import type { WirelessProfile } from '@/services/wireless/users';

const allSections = [
  { id: 'directory', label: 'Staff Directory', icon: 'ri-team-line' },
  { id: 'leave', label: 'Leave Requests', icon: 'ri-calendar-check-line' },
  { id: 'calendar', label: 'Leave Calendar', icon: 'ri-calendar-2-line' },
  { id: 'queries', label: 'Queries', icon: 'ri-file-shield-2-line' },
];

function AllQueriesSection() {
  const { user } = useAuth();
  const canManage = !!user?.permissions?.includes('hr_queries:manage') || user?.role === 'admin';
  const { queries, loading, close, reopen } = useStaffQueries();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = queries.find(q => q.id === selectedId) ?? null;

  if (selected) {
    return (
      <div className="space-y-3">
        <button onClick={() => setSelectedId(null)} className="text-xs font-semibold flex items-center gap-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <i className="ri-arrow-left-line" /> Back to all queries
        </button>
        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>To {selected.profile?.name ?? 'Staff'}</p>
        <QueryThread
          query={selected}
          canManage={canManage}
          onClose={canManage ? () => close(selected.id) : undefined}
          onReopen={canManage ? () => reopen(selected.id) : undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>All Queries ({queries.length})</p>
      {loading ? (
        <p className="text-xs py-6 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</p>
      ) : queries.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <i className="ri-file-shield-2-line text-2xl mb-2" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No queries issued yet — open a staff member's folder to issue one</p>
        </div>
      ) : (
        <div className="space-y-2">
          {queries.map(q => {
            const style = q.status === 'open'
              ? { bg: 'rgba(245,158,11,0.12)', fg: '#B45309', label: 'Awaiting Response' }
              : q.status === 'responded'
              ? { bg: 'rgba(59,130,246,0.12)', fg: '#1D4ED8', label: 'Responded' }
              : { bg: 'rgba(100,116,139,0.12)', fg: '#475569', label: 'Closed' };
            return (
              <button key={q.id} onClick={() => setSelectedId(q.id)}
                className="w-full text-left rounded-xl p-4 flex items-center justify-between gap-3 cursor-pointer"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>{q.subject}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    To {q.profile?.name ?? 'Staff'} · {new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full font-semibold whitespace-nowrap flex-shrink-0" style={{ background: style.bg, color: style.fg }}>
                  {style.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function HrPage() {
  const [activeSection, setActiveSection] = useState('directory');
  const [selectedStaff, setSelectedStaff] = useState<WirelessProfile | null>(null);

  const handleSelectSection = (id: string) => {
    setSelectedStaff(null);
    setActiveSection(id);
  };

  return (
    <AdminLayout title="HR" subtitle="Staff folders, leave, and queries">
      <div className="flex flex-col lg:flex-row gap-5">
        <SettingsSidebar sections={allSections} activeSection={activeSection} onSelect={handleSelectSection} />

        <div className="flex-1 min-w-0">
          {selectedStaff ? (
            <StaffDashboard staff={selectedStaff} onBack={() => setSelectedStaff(null)} />
          ) : (
            <>
              {activeSection === 'directory' && <StaffDirectory onSelectStaff={setSelectedStaff} />}
              {activeSection === 'leave' && <LeaveApprovalQueue />}
              {activeSection === 'calendar' && <LeaveCalendar />}
              {activeSection === 'queries' && <AllQueriesSection />}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
