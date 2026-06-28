"use client";

import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export type Permission =
  | 'manage_users'
  | 'manage_exams'
  | 'manage_institution'
  | 'manage_license'
  | 'manage_system'
  | 'manage_developers'
  | 'view_reports'
  | 'manage_payments'
  // New Institution Permissions
  | 'manage_admins'
  | 'manage_downloads'
  | 'manage_members'
  | 'manage_analytics'
  | 'manage_secure_browser'
  | 'manage_settings';

export class PermissionService {
  private static rolePermissions: Record<string, Permission[]> = {
    developer: [
      'manage_users',
      'manage_exams',
      'manage_institution',
      'manage_license',
      'manage_system',
      'manage_developers',
      'view_reports',
      'manage_payments',
      'manage_admins',
      'manage_downloads',
      'manage_members',
      'manage_analytics',
      'manage_secure_browser',
      'manage_settings',
    ],
    institution: [
      'manage_users',
      'manage_exams',
      'manage_institution',
      'manage_license',
      'view_reports',
      'manage_admins',
      'manage_downloads',
      'manage_members',
      'manage_analytics',
      'manage_secure_browser',
      'manage_settings',
    ],
    admin: [
      'manage_users',
      'manage_exams',
      'view_reports',
      'manage_admins',
      'manage_members',
      'manage_settings',
    ],
    faculty: [
      'manage_exams',
      'view_reports',
    ],
    student: [
      'view_reports',
    ],
  };

  /**
   * Checks if a given role has a specific permission statically.
   */
  public static hasPermission(role: string, permission: Permission): boolean {
    const permissions = this.rolePermissions[role.toLowerCase()] || [];
    return permissions.includes(permission);
  }

  /**
   * Checks if a user has a specific permission by fetching their role from Firestore.
   * Maintains backward compatibility with existing users.
   */
  public static async checkUserPermission(userId: string, permission: Permission): Promise<boolean> {
    try {
      // Check developers collection first
      const devDoc = await getDoc(doc(db, 'developers', userId));
      if (devDoc.exists()) {
        return this.hasPermission('developer', permission);
      }

      // Check standard users collection
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const role = userDoc.data()?.role || 'student';
        return this.hasPermission(role, permission);
      }

      return false;
    } catch (error) {
      console.error('Error checking user permission:', error);
      return false;
    }
  }
}