import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { canAccessModule, type AppModule } from '@/utils/access';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredModule?: AppModule;
}

export default function AuthGuard({ children, requiredModule }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasModuleAccess = requiredModule ? canAccessModule(user, requiredModule) : true;

  useEffect(() => {
    if (!isLoading && !isAuthenticated && location.pathname !== '/signin') {
      navigate('/signin', { replace: true });
      return;
    }

    if (!isLoading && isAuthenticated && !hasModuleAccess) {
      navigate('/access-denied', { replace: true });
    }
  }, [hasModuleAccess, isAuthenticated, isLoading, location.pathname, navigate]);

  // Block only if we have no user at all (cold start, no stored session)
  if (isLoading && !isAuthenticated) return null;
  if (!isAuthenticated || !hasModuleAccess) return null;

  return <>{children}</>;
}
