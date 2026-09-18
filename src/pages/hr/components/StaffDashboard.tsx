import { useState } from 'react';
import type { WirelessProfile } from '@/services/wireless/users';
import StaffOverviewTab from './StaffOverviewTab';
import StaffDocumentsTab from './StaffDocumentsTab';
import StaffLeaveTab from './StaffLeaveTab';
import StaffQueriesTab from './StaffQueriesTab';

const TABS = [
  ['overview', 'Overview'],
  ['documents', 'Documents'],
  ['leave', 'Leave'],
  ['queries', 'Queries'],
] as const;

type TabId = typeof TABS[number][0];

interface Props {
  staff: WirelessProfile;
  onBack: () => void;
}

export default function StaffDashboard({ staff, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-xs font-semibold flex items-center gap-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
        <i className="ri-arrow-left-line" /> Back to Staff Directory
      </button>

      <div className="flex border border-[hsl(var(--border))] rounded-xl p-1 bg-[hsl(var(--card))] w-fit overflow-x-auto">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === id ? 'text-white' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
            style={activeTab === id ? { background: '#EC0118' } : {}}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <StaffOverviewTab staff={staff} />}
      {activeTab === 'documents' && <StaffDocumentsTab profileId={staff.id} />}
      {activeTab === 'leave' && <StaffLeaveTab profileId={staff.id} />}
      {activeTab === 'queries' && <StaffQueriesTab profileId={staff.id} staffName={staff.name} />}
    </div>
  );
}
