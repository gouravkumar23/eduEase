import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, getDocs, collection, query, limit } from 'firebase/firestore';

export interface Developer {
  uid: string;
  email: string;
  name: string;
  createdAt: string;
  role: 'developer';
}

export class DeveloperRepository {
  /**
   * Checks if the developers collection is completely empty (for bootstrap purposes).
   */
  public static async isCollectionEmpty(): Promise<boolean> {
    try {
      const q = query(collection(db, 'developers'), limit(1));
      const snap = await getDocs(q);
      return snap.empty;
    } catch (error) {
      console.error('Error checking developers collection:', error);
      return false;
    }
  }

  /**
   * Fetches a developer by their UID.
   */
  public static async getById(uid: string): Promise<Developer | null> {
    try {
      const docSnap = await getDoc(doc(db, 'developers', uid));
      if (docSnap.exists()) {
        return docSnap.data() as Developer;
      }
      return null;
    } catch (error) {
      console.error('Error fetching developer:', error);
      return null;
    }
  }

  /**
   * Saves or updates a developer document.
   */
  public static async save(developer: Developer): Promise<void> {
    try {
      await setDoc(doc(db, 'developers', developer.uid), developer, { merge: true });
    } catch (error) {
      console.error('Error saving developer:', error);
      throw error;
    }
  }
}