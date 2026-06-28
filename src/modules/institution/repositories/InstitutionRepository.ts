"use client";

import { db } from '../../../core/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

export interface Institution {
  institutionId: string;
  institutionName: string;
  institutionType: 'university' | 'college' | 'school' | 'corporate' | 'other';
  registrationNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  contactEmail: string;
  contactPhone?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'suspended' | 'pending';
  subscriptionId?: string;
  licenseId?: string;
  domain: string;
  settings: {
    secureBrowserRequired: boolean;
    aiEnabled: boolean;
    maxUsers: number;
    allowedDomains?: string[];
  };
  analytics?: {
    totalExamsConducted?: number;
    totalActiveStudents?: number;
    totalActiveFaculty?: number;
  };
  featureFlags?: Record<string, boolean>;
  metadata?: Record<string, any>;
}

export class InstitutionRepository {
  /**
   * Fetches an institution by ID.
   */
  public static async getById(id: string): Promise<Institution | null> {
    try {
      const docSnap = await getDoc(doc(db, 'institutions', id));
      if (docSnap.exists()) {
        return docSnap.data() as Institution;
      }
      return null;
    } catch (error) {
      console.error('Error fetching institution:', error);
      return null;
    }
  }

  /**
   * Saves or updates an institution document.
   */
  public static async save(institution: Institution): Promise<void> {
    try {
      await setDoc(doc(db, 'institutions', institution.institutionId), institution, { merge: true });
    } catch (error) {
      console.error('Error saving institution:', error);
      throw error;
    }
  }

  /**
   * Fetches all institutions.
   */
  public static async getAll(): Promise<Institution[]> {
    try {
      const snap = await getDocs(collection(db, 'institutions'));
      return snap.docs.map(d => d.data() as Institution);
    } catch (error) {
      console.error('Error fetching all institutions:', error);
      return [];
    }
  }
}