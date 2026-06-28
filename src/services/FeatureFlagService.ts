import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type FeatureFlag =
  | 'AI Enabled'
  | 'Roadmaps Enabled'
  | 'Secure Browser Enabled'
  | 'Institution Enabled'
  | 'Payments Enabled'
  | 'Analytics Enabled'
  | 'Question Generator Enabled'
  | 'Developer Portal Enabled';

export class FeatureFlagService {
  private static defaultFlags: Record<FeatureFlag, boolean> = {
    'AI Enabled': true,
    'Roadmaps Enabled': false,
    'Secure Browser Enabled': false,
    'Institution': false,
    'Payments': false,
    'Developer Portal': true
  } as any;

  /**
   * Gets the status of a feature flag from Firestore, falling back to defaults.
   */
  public static async isEnabled(flag: FeatureFlag): Promise<boolean> {
    try {
      const flagDoc = await getDoc(doc(db, 'featureFlags', flag));
      if (flagDoc.exists()) {
        return !!flagDoc.data()?.enabled;
      }
      return this.defaultFlags[flag] ?? false;
    } catch (error) {
      console.error(`Error fetching feature flag ${flag}:`, error);
      return this.defaultFlags[flag] ?? false;
    }
  }

  /**
   * Sets the status of a feature flag.
   */
  public static async setFlag(flag: FeatureFlag, enabled: boolean): Promise<void> {
    try {
      await setDoc(doc(db, 'featureFlags', flag), {
        enabled,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error(`Error setting feature flag ${flag}:`, error);
      throw error;
    }
  }
}