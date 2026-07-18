import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function AccessDeniedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'hsl(var(--background))' }}>
      <div className="max-w-md w-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-8 text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(224,90,43,0.12)' }}>
          <i className="ri-shield-keyhole-line text-3xl" style={{ color: '#E05A2B' }} />
        </div>
        <h1 className="text-2xl font-black text-[hsl(var(--foreground))] tracking-tight mb-2">Access denied</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed mb-6">
          Your account{user ? ` (${user.role.replace('_', ' ')})` : ''} does not have permission to open this module.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#DC1F1F' }}
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="flex-1 py-3 rounded-xl text-sm font-semibold border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
}
