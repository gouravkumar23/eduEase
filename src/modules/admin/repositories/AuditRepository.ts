"use client";

import { db } from '../../../core/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface AuditLog {
  logId?: string;
  userId: string;
  userName: string;
  role: string;
  action: string;
  target: string;
  module: string;
  ip: string;
  browser: string;
  status: 'success' | 'failed';
  metadata?: Record<string, any>;
  timestamp: any;
}

export class AuditRepository {
  public static async log(log: Omit<AuditLog, 'timestamp'>): Promise<void> {
    try {
      await addDoc(collection(db, 'auditLogs'), {
        ...log,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error writing audit log:', error);
    }
  }
}