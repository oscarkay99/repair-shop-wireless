interface ProfileHeaderProps {
  avatar: string;
  name: string;
  email: string;
  roleLabel: string;
  roleColor: string;
  userPermissionsCount: number;
  allPermissionsCount: number;
  lastLogin: string;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

export default function ProfileHeader({
  avatar,
  name,
  email,
  roleLabel,
  roleColor,
  userPermissionsCount,
  allPermissionsCount,
  lastLogin,
  onLogout,
  onNavigate,
}: ProfileHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
        <div className="relative inline-block mb-4">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto"
            style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}CC)` }}
          >
            {avatar}
          </div>
          <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
            <i className="ri-camera-line text-slate-500 text-xs" />
          </button>
        </div>
        <h3 className="text-base font-bold text-slate-800">{name}</h3>
        <p className="text-xs text-slate-400 mb-3">{email}</p>
        <span className="text-xs px-3 py-1 rounded-full font-semibold text-white" style={{ background: roleColor }}>
          {roleLabel}
        </span>
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-slate-800">{userPermissionsCount}</p>
            <p className="text-[10px] text-slate-400">Modules Access</p>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{lastLogin}</p>
            <p className="text-[10px] text-slate-400">Last Login</p>
          </div>
        </div>
      </div>

      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 p-4 rounded-2xl border border-red-200 bg-white hover:bg-red-50 transition-colors cursor-pointer text-left"
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-50">
          <i className="ri-logout-box-line text-sm text-red-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-red-500">Sign Out</p>
          <p className="text-xs text-slate-400">End this session</p>
        </div>
      </button>
    </div>
  );
}
