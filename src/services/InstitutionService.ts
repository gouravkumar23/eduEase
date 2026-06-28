"use client";

import { InstitutionRepository, Institution } from '../repositories/InstitutionRepository';

export class InstitutionService {
  /**
   * Registers a new institution in the system.
   */
  public static async registerInstitution(
    name: string, 
    domain: string, 
    type: Institution['institutionType'] = 'university',
    contactEmail: string,
    maxUsers: number = 1000
  ): Promise<Institution> {
    const institutionId = domain.replace(/\./g, '-');
    const newInstitution: Institution = {
      institutionId,
      institutionName: name,
      institutionType: type,
      domain: domain.toLowerCase().trim(),
      contactEmail: contactEmail.toLowerCase().trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      settings: {
        secureBrowserRequired: false,
        aiEnabled: true,
        maxUsers
      },
      analytics: {
        totalExamsConducted: 0,
        totalActiveStudents: 0,
        totalActiveFaculty: 0
      },
      featureFlags: {
        'Roadmaps': false,
        'Question Generator': true,
        'AI': true,
        'Secure Browser': false,
        'Analytics': true,
        'Developer Messages': true,
        'Downloads': true
      }
    };

    await InstitutionRepository.save(newInstitution);
    return newInstitution;
  }

  /**
   * Suspends or activates an institution.
   */
  public static async updateStatus(id: string, status: 'active' | 'suspended'): Promise<void> {
    const institution = await InstitutionRepository.getById(id);
    if (!institution) throw new Error('Institution not found.');

    institution.status = status;
    institution.updatedAt = new Date().toISOString();
    await InstitutionRepository.save(institution);
  }
}