export type UserRole = 'student' | 'faculty' | 'admin' | 'developer';

export interface Permission {
  action: string;
  resource: string;
}

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  student: [
    'exam:take',
    'exam:view',
    'result:view',
    'profile:edit',
    'ai:chat',
    'learning:access',
    'roadmap:view',
  ],
  faculty: [
    'exam:create',
    'exam:edit',
    'exam:publish',
    'exam:monitor',
    'question:manage',
    'result:view',
    'profile:edit',
    'roadmap:manage',
    'analytics:view',
  ],
  admin: [
    'exam:approve',
    'exam:reject',
    'user:manage',
    'institution:manage',
    'settings:manage',
    'analytics:view',
    'audit:view',
    'violation:view',
  ],
  developer: [
    'system:manage',
    'feature:toggle',
    'institution:create',
    'license:manage',
    'plan:manage',
    'audit:view',
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission) || role === 'admin' || role === 'developer';
}

export function hasAnyPermission(role: UserRole, permissions: string[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}
