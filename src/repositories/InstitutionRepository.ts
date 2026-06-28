import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

export interface Institution {
  id: string;
  name: string;
  domain: string;
  createdAt: string;
  status: 'active' | 'suspended';
  settings: {
    secureBrowserRequired: boolean;
    aiEnabled: boolean;
    maxUsers: number;
  };
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
      await setDoc(doc(db, 'institutions', institution.id), institution, { merge: true });
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