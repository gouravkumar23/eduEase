"use client";

import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';

export interface License {
  licenseId: string;
  institutionId: string;
  licenseType: 'trial' | 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'lifetime';
  adminLimit: number;
  clientLimit: number;
  startDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'suspended' | 'revoked';
  lastValidation: string;
  offlineGracePeriod: number; // in days
  activationKey: string;
  authToken: string;
  notes?: string;
}

export class LicenseRepository {
  public static async getById(id: string): Promise<License | null> {
    try {
      const docSnap = await getDoc(doc(db, 'licenses', id));
      if (docSnap.exists()) return docSnap.data() as License;
      return null;
    } catch (error) {
      console.error('Error fetching license:', error);
      return null;
    }
  }

  public static async save(license: License): Promise<void> {
    try {
      await setDoc(doc(db, 'licenses', license.licenseId), license, { merge: true });
    } catch (error) {
      console.error('Error saving license:', error);
      throw error;
    }
  }

  public static async getByInstitutionId(institutionId: string): Promise<License[]> {
    try {
      const q = query(collection(db, 'licenses'), where('institutionId', '==', institutionId));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as License);
    } catch (error) {
      console.error('Error fetching licenses by institution:', error);
      return [];
    }
  }
}