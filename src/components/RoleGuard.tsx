import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PermissionService, Permission } from '../services/PermissionService';
import NotFoundPage from '../pages/NotFoundPage';

interface RoleGuardProps {
  children: ReactNode;
  requiredPermission?: Permission;
  fallback?: ReactNode;
}

export default function RoleGuard({ children, requiredPermission, fallback }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user) {
    return <>{fallback || <NotFoundPage />}</>;
  }

  // If a specific permission is required, check it
  if (requiredPermission) {
    const hasAccess = PermissionService.hasPermission(user.role, requiredPermission);
    if (!hasAccess) {
      return <>{fallback || <NotFoundPage />}</>;
    }
  }

  return <>{children}</>;
}