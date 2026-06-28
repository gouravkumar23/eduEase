"use client";

import { db } from '../../../core/firebase';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';

export interface Plan {
  planId: string;
  name: string;
  price: number;
  billingCycle: 'trial' | 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';
  features: string[];
  status: 'active' | 'inactive';
}

export class PlanService {
  public static async createPlan(plan: Plan): Promise<void> {
    try {
      await setDoc(doc(db, 'plans', plan.planId), plan, { merge: true });
    } catch (error) {
      console.error('Error saving plan:', error);
      throw error;
    }
  }

  public static async getPlans(): Promise<Plan[]> {
    try {
      const snap = await getDocs(collection(db, 'plans'));
      return snap.docs.map(d => d.data() as Plan);
    } catch (error) {
      console.error('Error fetching plans:', error);
      return [];
    }
  }
}