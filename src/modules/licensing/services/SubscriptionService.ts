"use client";

import { SubscriptionRepository, Subscription } from '../repositories/SubscriptionRepository';

export class SubscriptionService {
  public static async createSubscription(
    institutionId: string,
    planId: string,
    billingCycle: Subscription['billingCycle']
  ): Promise<Subscription> {
    const subscriptionId = crypto.randomUUID();
    const startDate = new Date().toISOString();
    
    let durationDays = 30;
    if (billingCycle === 'trial') durationDays = 14;
    else if (billingCycle === '3-months') durationDays = 90;
    else if (billingCycle === '6-months') durationDays = 180;
    else if (billingCycle === '12-months') durationDays = 365;

    const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const newSubscription: Subscription = {
      subscriptionId,
      institutionId,
      planId,
      status: billingCycle === 'trial' ? 'trialing' : 'active',
      startDate,
      endDate,
      billingCycle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await SubscriptionRepository.save(newSubscription);
    return newSubscription;
  }
}