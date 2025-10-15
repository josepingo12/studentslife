import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'admin' | 'partner' | 'client';
}

const ProtectedRoute = ({ children, requireRole }: ProtectedRouteProps) => {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();
  // DEBUG - aggiungi questi log
  console.log('ProtectedRoute - User:', user);
  console.log('ProtectedRoute - Loading:', loading);
  console.log('ProtectedRoute - UserRole:', userRole);
  console.log('ProtectedRoute - RequireRole:', requireRole);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not authenticated - redirect to login
        navigate('/login', { replace: true });
      } else if (requireRole && userRole !== requireRole) {
        // Authenticated but wrong role - redirect to appropriate dashboard
        if (userRole === 'admin') {
          navigate('/admin', { replace: true });
        } else if (userRole === 'partner') {
          navigate('/partner-dashboard', { replace: true });
        } else if (userRole === 'client') {
          navigate('/client-dashboard', { replace: true });
        }
      }
    }
  }, [user, loading, userRole, requireRole, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (requireRole && userRole !== requireRole)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
