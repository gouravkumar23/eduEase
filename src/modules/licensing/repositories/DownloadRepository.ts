"use client";

import { db } from '../../../core/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

export interface Download {
  downloadId: string;
  platform: 'Windows' | 'Linux' | 'Mac';
  version: string;
  releaseNotes: string;
  minVersion: string;
  forceUpdate: boolean;
  checksum: string;
  downloadUrl: string;
  createdAt: string;
}

export class DownloadRepository {
  public static async getById(id: string): Promise<Download | null> {
    try {
      const docSnap = await getDoc(doc(db, 'downloads', id));
      if (docSnap.exists()) return docSnap.data() as Download;
      return null;
    } catch (error) {
      console.error('Error fetching download:', error);
      return null;
    }
  }

  public static async save(download: Download): Promise<void> {
    try {
      await setDoc(doc(db, 'downloads', download.downloadId), download, { merge: true });
    } catch (error) {
      console.error('Error saving download:', error);
      throw error;
    }
  }

  public static async getAll(): Promise<Download[]> {
    try {
      const snap = await getDocs(collection(db, 'downloads'));
      return snap.docs.map(d => d.data() as Download);
    } catch (error) {
      console.error('Error fetching downloads:', error);
      return [];
    }
  }
}