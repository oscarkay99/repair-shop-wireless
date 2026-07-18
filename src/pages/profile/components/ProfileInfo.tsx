const allModulePermissions = ['Dashboard', 'Analytics', 'Audit Logs', 'POS', 'Inventory', 'Leads', 'Sales', 'Payments', 'Customers', 'Tickets', 'Warranty', 'WhatsApp', 'Instagram', 'TikTok', 'Marketing', 'Price Intel', 'Trade-In', 'Delivery', 'Wallet', 'Expenses', 'Suppliers', 'Reports', 'Loyalty', 'Calendar', 'Team', 'Settings', 'Authentication', 'AI Studio'];

interface ProfileInfoProps {
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  email: string;
  bio: string;
  setBio: (v: string) => void;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  saved: boolean;
  roleColor: string;
  roleLabel: string;
  userPermissions: string[];
  onSave: () => void;
}

export default function ProfileInfo({
  name, setName,
  phone, setPhone,
  email,
  bio, setBio,
  editMode, setEditMode,
  saved,
  roleColor,
  roleLabel,
  userPermissions,
  onSave,
}: ProfileInfoProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-slate-800">Personal Information</h3>
        {!editMode ? (
          <button onClick={() => setEditMode(true)} className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap">
            <i className="ri-edit-line mr-1" /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditMode(false)} className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-500 cursor-pointer whitespace-nowrap">Cancel</button>
            <button onClick={onSave} className="px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer whitespace-nowrap" style={{ background: '#DC1F1F' }}>Save Changes</button>
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Full Name</label>
            {editMode ? (
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 border border-slate-200" />
            ) : (
              <p className="text-sm font-semibold text-slate-800 py-2.5">{name}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Phone Number</label>
            {editMode ? (
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 border border-slate-200" />
            ) : (
              <p className="text-sm font-semibold text-slate-800 py-2.5">{phone}</p>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1.5">Email Address</label>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-800 py-2.5 flex-1">{email}</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-semibold">Verified</span>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1.5">Bio</label>
          {editMode ? (
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 border border-slate-200 resize-none" />
          ) : (
            <p className="text-sm text-slate-600 leading-relaxed py-1">{bio}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Role</label>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold text-white" style={{ background: roleColor }}>{roleLabel}</span>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Member Since</label>
            <p className="text-sm font-semibold text-slate-800">Jan 1, 2026</p>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-slate-100">
        <p className="text-xs font-bold text-slate-700 mb-3">Your Module Access ({userPermissions.length}/{allModulePermissions.length})</p>
        <div className="flex flex-wrap gap-1.5">
          {allModulePermissions.map(perm => (
            <span
              key={perm}
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${userPermissions.includes(perm) ? 'text-white' : 'bg-slate-100 text-slate-400'}`}
              style={userPermissions.includes(perm) ? { background: roleColor } : {}}
            >
              {perm}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
