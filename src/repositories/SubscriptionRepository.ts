"use client";

import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';

export interface Subscription {
  subscriptionId: string;
  institutionId: string;
  planId: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  startDate: string;
  endDate: string;
  billingCycle: 'trial' | 'monthly' | '3-months' | '6-months' | '12-months';
  createdAt: string;
  updatedAt: string;
}

export class SubscriptionRepository {
  public static async getById(id: string): Promise<Subscription | null> {
    try {
      const docSnap = await getDoc(doc(db, 'subscriptions', id));
      if (docSnap.exists()) return docSnap.data() as Subscription;
      return null;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }

  public static async save(subscription: Subscription): Promise<void> {
    try {
      await setDoc(doc(db, 'subscriptions', subscription.subscriptionId), subscription, { merge: true });
    } catch (error) {
      console.error('Error saving subscription:', error);
      throw error;
    }
  }

  public static async getByInstitutionId(institutionId: string): Promise<Subscription | null> {
    try {
      const q = query(collection(db, 'subscriptions'), where('institutionId', '==', institutionId), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) return snap.docs[0].data() as Subscription;
      return null;
    } catch (error) {
      console.error('Error fetching subscription by institution:', error);
      return null;
    }
  }
}