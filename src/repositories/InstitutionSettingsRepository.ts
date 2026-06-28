"use client";

import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface InstitutionSettings {
  theme: 'light' | 'dark' | 'system';
  defaultLanguage: string;
  defaultTimezone: string;
  academicYear: string;
  semesterPattern: 'semester' | 'trimester' | 'annual';
  sessionTimeout: number; // in minutes
  notificationPreferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

export class InstitutionSettingsRepository {
  private static getDefaultSettings(): InstitutionSettings {
    return {
      theme: 'light',
      defaultLanguage: 'en-US',
      defaultTimezone: 'UTC',
      academicYear: '2024-2025',
      semesterPattern: 'semester',
      sessionTimeout: 30,
      notificationPreferences: {
        email: true,
        push: true,
        sms: false
      }
    };
  }

  /**
   * Fetches settings for a specific institution.
   * Stores settings inside institutions/{institutionId}/settings/default
   */
  public static async getByInstitutionId(institutionId: string): Promise<InstitutionSettings> {
    try {
      const docRef = doc(db, 'institutions', institutionId, 'settings', 'default');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return {
          ...this.getDefaultSettings(),
          ...docSnap.data()
        } as InstitutionSettings;
      }
      return this.getDefaultSettings();
    } catch (error) {
      console.error('Error fetching institution settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Saves settings for a specific institution.
   */
  public static async save(institutionId: string, settings: InstitutionSettings): Promise<void> {
    try {
      const docRef = doc(db, 'institutions', institutionId, 'settings', 'default');
      await setDoc(docRef, settings, { merge: true });
    } catch (error) {
      console.error('Error saving institution settings:', error);
      throw error;
    }
  }
}