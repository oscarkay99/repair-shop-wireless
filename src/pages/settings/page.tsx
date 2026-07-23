import { useState, useEffect } from 'react';
import AdminLayout from '@/components/feature/AdminLayout';
import { useWirelessSettings } from '@/hooks/useWirelessSettings';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import SettingsSidebar from './components/SettingsSidebar';
import BrandingSection from './components/BrandingSection';
import OperationsSection from './components/OperationsSection';
import TeamRolesSection from './components/TeamRolesSection';
import SecuritySection from './components/SecuritySection';
import UsersSection from './components/UsersSection';
import ChangePasswordSection from './components/ChangePasswordSection';
import AddRoleModal from './components/AddRoleModal';
import InviteUserModal from './components/InviteUserModal';

const allSections = [
  { id: 'branding', label: 'Branding', icon: 'ri-palette-line', adminOnly: false },
  { id: 'operations', label: 'Operations', icon: 'ri-settings-4-line', adminOnly: false },
  { id: 'team', label: 'Team & Roles', icon: 'ri-team-line', adminOnly: true },
  { id: 'users', label: 'Users', icon: 'ri-user-settings-line', adminOnly: true },
  { id: 'security', label: 'Security', icon: 'ri-shield-keyhole-line', adminOnly: false },
  { id: 'password', label: 'Change Password', icon: 'ri-lock-password-line', adminOnly: false },
];

const teamRoles = [
  { id: 'r1', name: 'Admin', members: 0, permissions: ['All access', 'Settings', 'Financial reports', 'Team management', 'Delete records'] },
  { id: 'r2', name: 'Sales Manager', members: 0, permissions: ['Sales', 'Leads', 'Customers', 'Inventory view', 'Reports view', 'Team view'] },
  { id: 'r4', name: 'Technician', members: 0, permissions: ['Tickets', 'Inventory view', 'Customers view'] },
  { id: 'r5', name: 'Inventory Manager', members: 0, permissions: ['Inventory', 'Purchase Orders', 'Suppliers', 'Reports view'] },
];

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  const sections = allSections.filter(s => !s.adminOnly || isAdmin);
  const [activeSection, setActiveSection] = useState('branding');
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const { settings, save } = useWirelessSettings();
  const { showToast } = useToast();
  const [businessName, setBusinessName] = useState('Wireless');
  const [tagline, setTagline] = useState('Premium Gadgets in Accra');
  const [phone, setPhone] = useState('+233 24 000 0000');
  const [whatsapp, setWhatsapp] = useState('+233 24 000 0000');
  const [address, setAddress] = useState('Accra Mall, Accra, Ghana');
  const [primaryColor, setPrimaryColor] = useState('#EC0118');
  const [showAddRole, setShowAddRole] = useState(false);
  const [editingRole, setEditingRole] = useState<{ id: string; name: string; permissions: string[] } | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  const applySettings = () => {
    if (!settings) return;
    setBusinessName(settings.business_name);
    setTagline(settings.tagline);
    setPhone(settings.phone);
    setWhatsapp(settings.whatsapp);
    setAddress(settings.address);
    setPrimaryColor(settings.primary_color);
    setDirty(false);
  };

  useEffect(applySettings, [settings]);

  // Every branding field routes through this one `dirty` flag, so the save
  // bar (which only ever persists branding fields) never appears on other
  // tabs claiming there are unsaved changes there.
  const markDirty = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setDirty(true); };

  const handleSave = async () => {
    try {
      await save({
        business_name: businessName,
        tagline,
        phone,
        whatsapp,
        address,
        primary_color: primaryColor,
      });
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      // Keep `dirty` true and skip the success indicator — the save didn't
      // actually persist, so the unsaved-changes state must stay visible.
      showToast(e instanceof Error ? e.message : 'Failed to save settings', 'error');
    }
  };

  return (
    <AdminLayout title="Settings" subtitle="Configure your Wireless Command Center">
      <div className="flex flex-col lg:flex-row gap-5">
        <SettingsSidebar sections={sections} activeSection={activeSection} onSelect={setActiveSection} />

        <div className="flex-1 min-w-0 space-y-5">
          {activeSection === 'branding' && (
            <BrandingSection
              businessName={businessName} setBusinessName={markDirty(setBusinessName)}
              tagline={tagline} setTagline={markDirty(setTagline)}
              phone={phone} setPhone={markDirty(setPhone)}
              whatsapp={whatsapp} setWhatsapp={markDirty(setWhatsapp)}
              address={address} setAddress={markDirty(setAddress)}
              primaryColor={primaryColor} setPrimaryColor={markDirty(setPrimaryColor)}
            />
          )}

          {activeSection === 'operations' && <OperationsSection />}

          {activeSection === 'team' && isAdmin && (
            <TeamRolesSection
              roles={teamRoles}
              onAddRole={() => { setEditingRole(null); setShowAddRole(true); }}
              onEditRole={(role) => { setEditingRole(role); setShowAddRole(true); }}
              onInviteMember={() => setShowInvite(true)}
            />
          )}

          {activeSection === 'security' && <SecuritySection />}

          {activeSection === 'users' && isAdmin && <UsersSection />}

          {activeSection === 'password' && <ChangePasswordSection />}

          {/* Save bar — Branding is the only tab whose fields route through this;
              every other section (Operations, Users, Password) saves itself
              immediately, so showing this bar there would be misleading and
              its Save button would silently persist stale branding fields. */}
          {activeSection === 'branding' && (
            <div className="sticky bottom-0 rounded-2xl px-5 py-3 flex items-center justify-between"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <span className="text-xs font-medium" style={{ color: saved ? '#22c55e' : 'hsl(var(--muted-foreground))' }}>
                {saved ? '✓ Changes saved' : dirty ? 'Unsaved changes' : 'No changes'}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={applySettings}
                  disabled={!dirty}
                  className="text-xs font-semibold px-3 h-8 rounded-lg disabled:opacity-50"
                  style={{ color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}
                  onMouseEnter={e => { if (dirty) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                  Discard
                </button>
                <button onClick={handleSave}
                  disabled={!dirty}
                  className="px-5 h-8 text-white text-xs font-bold rounded-lg whitespace-nowrap transition-colors disabled:opacity-50"
                  style={{ background: 'hsl(var(--primary))' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}>
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddRoleModal open={showAddRole} onClose={() => { setShowAddRole(false); setEditingRole(null); }} editRole={editingRole} />
      <InviteUserModal open={showInvite} onClose={() => setShowInvite(false)} />
    </AdminLayout>
  );
}
