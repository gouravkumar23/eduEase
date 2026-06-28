import { ReactNode, useEffect, useState } from 'react';
import { auth } from '../../../core/firebase';
import { DeveloperRepository } from '../repositories/DeveloperRepository';
import NotFoundPage from '../../shared-pages';
import { Loader2 } from 'lucide-react';

interface DeveloperGuardProps {
  children: ReactNode;
}

export default function DeveloperGuard({ children }: DeveloperGuardProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const dev = await DeveloperRepository.getById(user.uid);
        setIsAuthorized(!!dev);
      } else {
        // Check if the developers collection is empty to allow bootstrap
        const isEmpty = await DeveloperRepository.isCollectionEmpty();
        setIsAuthorized(isEmpty);
      }
    });

    return () => unsubscribe();
  }, []);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    return <NotFoundPage />;
  }

  return <>{children}</>;
}