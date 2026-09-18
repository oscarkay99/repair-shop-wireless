import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { canAccessModule, type AppModule } from '@/utils/access';
import PushNotificationPrompt from '@/components/shared/PushNotificationPrompt';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredModule?: AppModule;
}

export default function AuthGuard({ children, requiredModule }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const hasModuleAccess = requiredModule ? canAccessModule(user, requiredModule) : true;

  // Never render from cached role metadata while the server session/profile
  // is still being revalidated. A stale cache must not flash privileged UI.
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-label="Loading Wireless">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-red-700" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }
  if (!hasModuleAccess) {
    return <Navigate to="/access-denied" replace />;
  }

  return (
    <>
      {children}
      <PushNotificationPrompt />
    </>
  );
}
