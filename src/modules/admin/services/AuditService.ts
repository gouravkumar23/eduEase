"use client";

import { AuditRepository } from '../../admin/repositories/AuditRepository';

export class AuditService {
  public static async logAction(
    userId: string,
    userName: string,
    role: string,
    action: string,
    target: string,
    module: string,
    status: 'success' | 'failed',
    metadata?: Record<string, any>
  ): Promise<void> {
    const userAgent = navigator.userAgent;
    await AuditRepository.log({
      userId,
      userName,
      role,
      action,
      target,
      module,
      ip: '127.0.0.1', // Placeholder for client-side IP
      browser: userAgent,
      status,
      metadata
    });
  }
}