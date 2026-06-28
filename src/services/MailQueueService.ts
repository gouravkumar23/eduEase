"use client";

import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type MailType =
  | 'institution_registration'
  | 'admin_created'
  | 'password_reset'
  | 'trial_ending'
  | 'subscription_expiry'
  | 'license_activated'
  | 'security_alert';

export class MailQueueService {
  public static async queueMail(
    to: string,
    subject: string,
    body: string,
    type: MailType
  ): Promise<void> {
    try {
      await addDoc(collection(db, 'mailQueue'), {
        to,
        subject,
        body,
        type,
        status: 'pending',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error queueing mail:', error);
    }
  }
}