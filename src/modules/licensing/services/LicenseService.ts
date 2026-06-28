"use client";

import { LicenseRepository, License } from '../../admin/repositories/LicenseRepository';

export class LicenseService {
  public static async createLicense(
    institutionId: string,
    licenseType: License['licenseType'],
    adminLimit: number,
    clientLimit: number,
    durationDays: number
  ): Promise<License> {
    const licenseId = crypto.randomUUID();
    const startDate = new Date().toISOString();
    const expiryDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    
    const newLicense: License = {
      licenseId,
      institutionId,
      licenseType,
      adminLimit,
      clientLimit,
      startDate,
      expiryDate,
      status: 'active',
      lastValidation: new Date().toISOString(),
      offlineGracePeriod: 7,
      activationKey: Math.random().toString(36).substring(2, 10).toUpperCase(),
      authToken: crypto.randomUUID()
    };

    await LicenseRepository.save(newLicense);
    return newLicense;
  }

  public static async validateLicense(licenseId: string): Promise<boolean> {
    const license = await LicenseRepository.getById(licenseId);
    if (!license) return false;
    if (license.status !== 'active') return false;
    if (new Date() > new Date(license.expiryDate)) {
      license.status = 'expired';
      await LicenseRepository.save(license);
      return false;
    }
    license.lastValidation = new Date().toISOString();
    await LicenseRepository.save(license);
    return true;
  }
}