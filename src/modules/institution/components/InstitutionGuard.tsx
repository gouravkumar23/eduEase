import { ReactNode } from 'react';
import { useAuth } from '../../../modules/auth';
import NotFoundPage from '../../shared-pages';

interface InstitutionGuardProps {
  children: ReactNode;
}

export default function InstitutionGuard({ children }: InstitutionGuardProps) {
  const { user } = useAuth();

  // For now, only allow active users with institution-level permissions or developers
  if (!user || (user.role !== 'admin' && user.role !== 'faculty')) {
    return <NotFoundPage />;
  }

  return <>{children}</>;
}