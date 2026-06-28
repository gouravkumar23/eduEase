"use client";

import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

export interface Roadmap {
  id: string;
  title: string;
  description: string;
  institutionId: string;
  createdBy: string;
  ownerName: string;
  visibility: 'public' | 'private' | 'institution';
  status: 'active' | 'archived' | 'draft';
  nodeCount: number;
  createdAt: any;
  updatedAt: any;
}

export class RoadmapRepository {
  private static collectionName = 'roadmaps';

  public static async getById(id: string): Promise<Roadmap | null> {
    try {
      const docSnap = await getDoc(doc(db, this.collectionName, id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Roadmap;
      }
      return null;
    } catch (error) {
      console.error('Error fetching roadmap:', error);
      throw error;
    }
  }

  public static async save(roadmap: Roadmap): Promise<void> {
    try {
      const { id, ...data } = roadmap;
      await setDoc(doc(db, this.collectionName, id), {
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving roadmap:', error);
      throw error;
    }
  }

  public static async create(roadmap: Omit<Roadmap, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      await setDoc(doc(db, this.collectionName, roadmap.id), {
        ...roadmap,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating roadmap:', error);
      throw error;
    }
  }

  public static async getAll(institutionId?: string): Promise<Roadmap[]> {
    try {
      const colRef = collection(db, this.collectionName);
      let q = query(colRef, orderBy('createdAt', 'desc'));
      
      if (institutionId) {
        q = query(colRef, where('institutionId', '==', institutionId), orderBy('createdAt', 'desc'));
      }
      
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Roadmap));
    } catch (error) {
      console.error('Error fetching all roadmaps:', error);
      throw error;
    }
  }

  public static async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, id));
    } catch (error) {
      console.error('Error deleting roadmap:', error);
      throw error;
    }
  }
}