import { InstitutionRepository, Institution } from '../repositories/InstitutionRepository';

export class InstitutionService {
  /**
   * Registers a new institution in the system.
   */
  public static async registerInstitution(name: string, domain: string, maxUsers: number = 1000): Promise<Institution> {
    const id = domain.replace(/\./g, '-');
    const newInstitution: Institution = {
      id,
      name,
      domain: domain.toLowerCase().trim(),
      createdAt: new Date().toISOString(),
      status: 'active',
      settings: {
        secureBrowserRequired: false,
        aiEnabled: true,
        maxUsers
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
    await InstitutionRepository.save(institution);
  }
}