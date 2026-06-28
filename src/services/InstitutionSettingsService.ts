"use client";

import { InstitutionSettingsRepository, InstitutionSettings } from '../repositories/InstitutionSettingsRepository';
import { AuditService } from './AuditService';

export class InstitutionSettingsService {
  /**
   * Retrieves settings for an institution.
   */
  public static async getSettings(institutionId: string): Promise<InstitutionSettings> {
    if (!institutionId) {
      throw new Error('Institution ID is required to fetch settings.');
    }
    return await InstitutionSettingsRepository.getByInstitutionId(institutionId);
  }

  /**
   * Updates settings for an institution and logs the action.
   */
  public static async updateSettings(
    institutionId: string,
    settings: InstitutionSettings,
    userId: string,
    userName: string,
    userRole: string
  ): Promise<void> {
    if (!institutionId) {
      throw new Error('Institution ID is required to update settings.');
    }

    try {
      await InstitutionSettingsRepository.save(institutionId, settings);

      // Log the action in the audit log
      await AuditService.logAction(
        userId,
        userName,
        userRole,
        'Update Settings',
        `Institution Settings for ${institutionId}`,
        'Institution Settings',
        'success',
        { theme: settings.theme, academicYear: settings.academicYear }
      );
    } catch (error: any) {
      // Log failed attempt
      await AuditService.logAction(
        userId,
        userName,
        userRole,
        'Update Settings',
        `Institution Settings for ${institutionId}`,
        'Institution Settings',
        'failed',
        { error: error.message }
      );
      throw error;
    }
  }
}