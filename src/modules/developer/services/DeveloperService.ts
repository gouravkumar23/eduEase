import { DeveloperRepository, Developer } from '../repositories/DeveloperRepository';
import { auth } from '../../../core/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export class DeveloperService {
  /**
   * Authenticates a developer independently from standard users.
   */
  public static async loginDeveloper(email: string, password: string): Promise<Developer> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const developer = await DeveloperRepository.getById(uid);
    if (!developer) {
      // Sign out immediately if they are not in the developers collection
      await auth.signOut();
      throw new Error('Developer account not found.');
    }

    return developer;
  }

  /**
   * Bootstraps the first developer account if the collection is empty.
   */
  public static async bootstrapFirstDeveloper(email: string, password: string, name: string): Promise<Developer> {
    const isEmpty = await DeveloperRepository.isCollectionEmpty();
    if (!isEmpty) {
      throw new Error('Bootstrap is disabled. Developer accounts already exist.');
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const newDev: Developer = {
      uid,
      email: email.toLowerCase().trim(),
      name,
      createdAt: new Date().toISOString(),
      role: 'developer'
    };

    await DeveloperRepository.save(newDev);
    return newDev;
  }

  /**
   * Creates a new developer account. Only callable by an authenticated developer.
   */
  public static async createDeveloper(email: string, password: string, name: string): Promise<Developer> {
    // Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const newDev: Developer = {
      uid,
      email: email.toLowerCase().trim(),
      name,
      createdAt: new Date().toISOString(),
      role: 'developer'
    };

    await DeveloperRepository.save(newDev);
    return newDev;
  }
}