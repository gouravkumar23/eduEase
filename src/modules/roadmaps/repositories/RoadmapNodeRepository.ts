"use client";

import { db } from '../../../core/firebase';
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
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';

export type NodeType = 'ROADMAP' | 'PORTION' | 'SUBJECT' | 'LESSON' | 'TOPIC' | 'SUBTOPIC';

export interface RoadmapNode {
  id: string;
  roadmapId: string;
  parentId: string; // 'root' if top-level
  nodeType: NodeType;
  title: string;
  description: string;
  order: number;
  depth: number;
  estimatedHours: number;
  estimatedQuestions: number;
  createdBy: string;
  institutionId: string;
  visibility: 'public' | 'private' | 'institution';
  difficulty: 'easy' | 'medium' | 'hard';
  color: string;
  icon: string;
  tags: string[];
  referenceLinks: string[];
  notes: string;
  status: 'active' | 'completed' | 'draft';
  createdAt: any;
  updatedAt: any;
}

export class RoadmapNodeRepository {
  private static collectionName = 'roadmapNodes';

  public static async getById(id: string): Promise<RoadmapNode | null> {
    try {
      const docSnap = await getDoc(doc(db, this.collectionName, id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as RoadmapNode;
      }
      return null;
    } catch (error) {
      console.error('Error fetching roadmap node:', error);
      throw error;
    }
  }

  public static async getByRoadmapId(roadmapId: string): Promise<RoadmapNode[]> {
    try {
      const q = query(
        collection(db, this.collectionName), 
        where('roadmapId', '==', roadmapId),
        orderBy('order', 'asc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as RoadmapNode));
    } catch (error) {
      console.error('Error fetching nodes by roadmap ID:', error);
      throw error;
    }
  }

  public static async save(node: RoadmapNode): Promise<void> {
    try {
      const { id, ...data } = node;
      await setDoc(doc(db, this.collectionName, id), {
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving roadmap node:', error);
      throw error;
    }
  }

  public static async create(node: Omit<RoadmapNode, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      await setDoc(doc(db, this.collectionName, node.id), {
        ...node,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating roadmap node:', error);
      throw error;
    }
  }

  public static async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, id));
    } catch (error) {
      console.error('Error deleting roadmap node:', error);
      throw error;
    }
  }

  public static async deleteBatch(ids: string[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      ids.forEach(id => {
        batch.delete(doc(db, this.collectionName, id));
      });
      await batch.commit();
    } catch (error) {
      console.error('Error batch deleting roadmap nodes:', error);
      throw error;
    }
  }

  public static async saveBatch(nodes: RoadmapNode[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      nodes.forEach(node => {
        const { id, ...data } = node;
        batch.set(doc(db, this.collectionName, id), {
          ...data,
          updatedAt: serverTimestamp()
        }, { merge: true });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error batch saving roadmap nodes:', error);
      throw error;
    }
  }

  public static async searchNodes(searchTerm: string, institutionId?: string): Promise<RoadmapNode[]> {
    try {
      const colRef = collection(db, this.collectionName);
      let q = query(colRef, orderBy('title'));
      if (institutionId) {
        q = query(colRef, where('institutionId', '==', institutionId), orderBy('title'));
      }
      const snap = await getDocs(q);
      const term = searchTerm.toLowerCase();
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as RoadmapNode))
        .filter(node => node.title.toLowerCase().includes(term));
    } catch (error) {
      console.error('Error searching nodes:', error);
      throw error;
    }
  }
}