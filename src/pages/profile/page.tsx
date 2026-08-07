import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/feature/AdminLayout';
import { useAuth } from '@/hooks/useAuth';
import { roleLabels, roleColors, rolePermissions } from '@/mocks/users';
import { getAuditLogs, type AuditLogRecord } from '@/services/wireless/auditLogs';
import { getMyProfile, updateMyProfile, changePassword as changePasswordReal } from '@/services/wireless/users';
import Pagination from '@/components/shared/Pagination';
import { errMessage } from '@/utils/errors';

const ACTIVITY_PAGE_SIZE = 15;

const allModulePermissions = ['Dashboard', 'Analytics', 'Audit Logs', 'POS', 'Inventory', 'Leads', 'Sales', 'Payments', 'Customers', 'Tickets', 'Warranty', 'WhatsApp', 'Instagram', 'TikTok', 'Marketing', 'Price Intel', 'Trade-In', 'Delivery', 'Wallet', 'Expenses', 'Suppliers', 'Reports', 'Loyalty', 'Calendar', 'Team', 'Settings', 'Authentication', 'AI Studio'];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'activity'>('profile');
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [email] = useState(user?.email || '');
  const [bio, setBio] = useState('');
  const [birthday, setBirthday] = useState('');
  const [memberSince, setMemberSince] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'activity') {
      setAuditLoading(true);
      getAuditLogs({ page: auditPage, pageSize: ACTIVITY_PAGE_SIZE })
        .then(({ logs, total }) => { setAuditLogs(logs); setAuditTotal(total); })
        .finally(() => setAuditLoading(false));
    }
  }, [activeTab, auditPage]);

  const pagedAuditLogs = auditLogs;
  const auditTotalPages = Math.max(1, Math.ceil(auditTotal / ACTIVITY_PAGE_SIZE));

  useEffect(() => {
    getMyProfile().then(profile => {
      if (!profile) return;
      setName(profile.name);
      setPhone(profile.phone);
      setBio(profile.bio);
      setBirthday(profile.birthday ?? '');
      setMemberSince(profile.created_at);
    }).catch(() => {});
  }, []);

  const roleColor = user?.role ? roleColors[user.role] : '#EC0118';
  const roleLabel = user?.role ? roleLabels[user.role] : 'User';
  const userPermissions = user?.role ? rolePermissions[user.role] : [];

  const handleSaveProfile = async () => {
    try {
      await updateMyProfile({ name, phone, bio, birthday: birthday || null });
      setSaved(true);
      setEditMode(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setPasswordError(errMessage(e, 'Failed to save profile'));
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (!currentPassword) { setPasswordError('Please enter your current password'); return; }
    if (newPassword.length < 10) { setPasswordError('New password must be at least 10 characters'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match'); return; }
    setPasswordLoading(true);
    try {
      await changePasswordReal(newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (e) {
      setPasswordError(errMessage(e, 'Failed to change password'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  if (!user) {
    navigate('/signin');
    return null;
  }

  const passwordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const levels = [
      { score: 1, label: 'Weak', color: '#E05A2B' },
      { score: 2, label: 'Fair', color: '#F59E0B' },
      { score: 3, label: 'Good', color: '#EC0118' },
      { score: 4, label: 'Strong', color: '#25D366' },
    ];
    return levels[score - 1] || { score: 0, label: '', color: '' };
  };

  const strength = passwordStrength(newPassword);

  return (
    <AdminLayout title="My Profile" subtitle="Manage your account, security and preferences">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left — Profile Card */}
        <div className="space-y-4">
          {/* Avatar Card */}
          <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-6 text-center">
            <div className="relative inline-block mb-4">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto"
                style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}CC)` }}
              >
                {user.avatar}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex items-center justify-center cursor-pointer hover:bg-[hsl(var(--muted))] transition-colors">
                <i className="ri-camera-line text-[hsl(var(--muted-foreground))] text-xs" />
              </button>
            </div>
            <h3 className="text-base font-bold text-[hsl(var(--foreground))]">{user.name}</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">{user.email}</p>
            <span className="text-xs px-3 py-1 rounded-full font-semibold text-white" style={{ background: roleColor }}>
              {roleLabel}
            </span>
            <div className="mt-4 pt-4 border-t border-[hsl(var(--border))] grid grid-cols-1 sm:grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-[hsl(var(--foreground))]">{userPermissions.length}</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Modules Access</p>
              </div>
              <div>
                <p className="text-lg font-bold text-[hsl(var(--foreground))]">{user.lastLogin}</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Last Login</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border border-red-200 bg-[hsl(var(--card))] hover:bg-red-50 transition-colors cursor-pointer text-left"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-50">
              <i className="ri-logout-box-line text-sm text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-500">Sign Out</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">End this session on this device</p>
            </div>
          </button>
        </div>

        {/* Right — Tabs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab Bar */}
          <div className="flex border border-[hsl(var(--border))] rounded-xl p-1 bg-[hsl(var(--card))] w-fit">
            {[['profile', 'Profile Info'], ['security', 'Security'], ['activity', 'Activity Log']].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as 'profile' | 'security' | 'activity')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === id ? 'text-white' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
                style={activeTab === id ? { background: '#EC0118' } : {}}
              >
                {label}
              </button>
            ))}
          </div>

          {/* PROFILE INFO */}
          {activeTab === 'profile' && (
            <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">Personal Information</h3>
                {!editMode ? (
                  <button onClick={() => setEditMode(true)} className="px-4 py-2 rounded-xl text-xs font-semibold border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] cursor-pointer whitespace-nowrap">
                    <i className="ri-edit-line mr-1" /> Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setEditMode(false)} className="px-4 py-2 rounded-xl text-xs font-semibold border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] cursor-pointer whitespace-nowrap">Cancel</button>
                    <button onClick={handleSaveProfile} className="px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer whitespace-nowrap" style={{ background: '#EC0118' }}>Save Changes</button>
                  </div>
                )}
              </div>

              {saved && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100 mb-4">
                  <i className="ri-check-double-line text-green-500 text-sm" />
                  <p className="text-xs text-green-600 font-medium">Profile updated successfully!</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] block mb-1.5">Full Name</label>
                    {editMode ? (
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-[hsl(var(--muted))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border))] border border-[hsl(var(--border))]" />
                    ) : (
                      <p className="text-sm font-semibold text-[hsl(var(--foreground))] py-2.5">{name}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] block mb-1.5">Phone Number</label>
                    {editMode ? (
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-[hsl(var(--muted))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border))] border border-[hsl(var(--border))]" />
                    ) : (
                      <p className="text-sm font-semibold text-[hsl(var(--foreground))] py-2.5">{phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] block mb-1.5">Email Address</label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[hsl(var(--foreground))] py-2.5 flex-1">{email}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-semibold">Verified</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] block mb-1.5">Bio</label>
                  {editMode ? (
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-xl bg-[hsl(var(--muted))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border))] border border-[hsl(var(--border))] resize-none" />
                  ) : (
                    <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed py-1">{bio}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] block mb-1.5">Birthday</label>
                  {editMode ? (
                    <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-[hsl(var(--muted))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border))] border border-[hsl(var(--border))]" />
                  ) : (
                    <p className="text-sm font-semibold text-[hsl(var(--foreground))] py-2.5">
                      {birthday ? new Date(birthday + 'T00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'Not set, used for the birthday banner everyone sees'}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[hsl(var(--border))]">
                  <div>
                    <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] block mb-1">Role</label>
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold text-white" style={{ background: roleColor }}>{roleLabel}</span>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] block mb-1">Member Since</label>
                    <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                      {memberSince ? new Date(memberSince).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="mt-5 pt-5 border-t border-[hsl(var(--border))]">
                <p className="text-xs font-bold text-[hsl(var(--foreground))] mb-3">Your Module Access ({userPermissions.length}/{allModulePermissions.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {allModulePermissions.map(perm => (
                    <span
                      key={perm}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${userPermissions.includes(perm) ? 'text-white' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`}
                      style={userPermissions.includes(perm) ? { background: roleColor } : {}}
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-6">
                <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-5">Change Password</h3>

                {passwordSuccess && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100 mb-4">
                    <i className="ri-check-double-line text-green-500 text-sm" />
                    <p className="text-xs text-green-600 font-medium">Password changed successfully!</p>
                  </div>
                )}

                {passwordError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-4">
                    <i className="ri-error-warning-line text-red-500 text-sm" />
                    <p className="text-xs text-red-600">{passwordError}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] block mb-1.5">Current Password</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                        <i className="ri-lock-line text-[hsl(var(--muted-foreground))] text-sm" />
                      </div>
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[hsl(var(--muted))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border))] border border-[hsl(var(--border))]"
                      />
                      <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                        <i className={`${showCurrent ? 'ri-eye-off-line' : 'ri-eye-line'} text-[hsl(var(--muted-foreground))] text-sm`} />
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] block mb-1.5">New Password</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                        <i className="ri-lock-password-line text-[hsl(var(--muted-foreground))] text-sm" />
                      </div>
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[hsl(var(--muted))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border))] border border-[hsl(var(--border))]"
                      />
                      <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                        <i className={`${showNew ? 'ri-eye-off-line' : 'ri-eye-line'} text-[hsl(var(--muted-foreground))] text-sm`} />
                      </button>
                    </div>
                    {newPassword && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex-1 h-1 rounded-full transition-all" style={{ background: i <= strength.score ? strength.color : 'hsl(var(--border))' }} />
                          ))}
                        </div>
                        <p className="text-[10px] font-semibold" style={{ color: strength.color }}>{strength.label}</p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] block mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                        <i className="ri-lock-password-line text-[hsl(var(--muted-foreground))] text-sm" />
                      </div>
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className={`w-full pl-9 pr-10 py-2.5 rounded-xl bg-[hsl(var(--muted))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border))] border ${confirmPassword && confirmPassword !== newPassword ? 'border-red-300' : 'border-[hsl(var(--border))]'}`}
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                        <i className={`${showConfirm ? 'ri-eye-off-line' : 'ri-eye-line'} text-[hsl(var(--muted-foreground))] text-sm`} />
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-[10px] text-red-500 mt-1">Passwords do not match</p>
                    )}
                  </div>

                  <div className="bg-[hsl(var(--muted))] rounded-xl p-3">
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-semibold mb-1">Password Requirements</p>
                    {[
                      { rule: 'At least 10 characters', met: newPassword.length >= 10 },
                      { rule: 'At least one uppercase letter', met: /[A-Z]/.test(newPassword) },
                      { rule: 'At least one number', met: /[0-9]/.test(newPassword) },
                      { rule: 'At least one special character', met: /[^A-Za-z0-9]/.test(newPassword) },
                    ].map(item => (
                      <div key={item.rule} className="flex items-center gap-2 mt-1">
                        <i className={`${item.met ? 'ri-check-line text-green-500' : 'ri-close-line text-[hsl(var(--muted-foreground))]'} text-xs`} />
                        <span className={`text-[10px] ${item.met ? 'text-green-600' : 'text-[hsl(var(--muted-foreground))]'}`}>{item.rule}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleChangePassword}
                    disabled={passwordLoading}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #0F172A, #EC0118)' }}
                  >
                    {passwordLoading ? 'Updating Password...' : 'Update Password'}
                  </button>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-5">
                <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-4">Active Sessions</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--muted))]">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(236,1,24,0.08)' }}>
                      <i className="ri-computer-line text-sm" style={{ color: '#EC0118' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Current session</p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Active now</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-semibold whitespace-nowrap">Current</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVITY LOG */}
          {activeTab === 'activity' && (
            <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
              <div className="p-5 border-b border-[hsl(var(--border))] flex items-center justify-between">
                <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">System Activity Log</h3>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">All roles · {auditTotal} event{auditTotal !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-[hsl(var(--border))]">
                {auditLoading ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <i className="ri-loader-4-line text-2xl text-[hsl(var(--muted-foreground))] mb-2 animate-spin" />
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Loading activity…</p>
                  </div>
                ) : auditTotal === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <i className="ri-history-line text-2xl text-[hsl(var(--muted-foreground))] mb-2" />
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">No activity recorded yet</p>
                  </div>
                ) : pagedAuditLogs.map(log => {
                  const isSuccess = log.status === 'success';
                  const isFailure = log.status === 'failure';
                  const iconColor = isFailure ? '#E05A2B' : isSuccess ? '#EC0118' : '#F59E0B';
                  const icon = log.action === 'create' ? 'ri-add-circle-line' : log.action === 'update' ? 'ri-edit-line' : log.action === 'delete' ? 'ri-delete-bin-line' : log.action === 'verify' ? 'ri-checkbox-circle-line' : 'ri-history-line';
                  const ts = new Date(log.createdAt);
                  const timeLabel = ts.toLocaleString('en-GH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-[hsl(var(--muted))]/50 transition-colors">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${iconColor}15` }}>
                        <i className={`${icon} text-sm`} style={{ color: iconColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{log.summary ?? `${log.action} · ${log.entityType ?? '—'}`}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${isFailure ? 'bg-red-50 text-red-500' : isSuccess ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                            {log.status}
                          </span>
                        </div>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                          {log.actorName ?? log.actorEmail ?? 'System'}
                          {log.entityType && ` · ${log.entityType}`}
                          {log.requestPath && ` · ${log.requestPath}`}
                        </p>
                      </div>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))] flex-shrink-0 whitespace-nowrap">{timeLabel}</p>
                    </div>
                  );
                })}
              </div>
              {!auditLoading && auditTotal > 0 && (
                <div className="px-5 pb-4">
                  <Pagination page={auditPage} pageCount={auditTotalPages} total={auditTotal} pageSize={ACTIVITY_PAGE_SIZE} onPageChange={setAuditPage} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
