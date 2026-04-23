import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Persist the round-robin index in localStorage
let keyIndex = parseInt(localStorage.getItem('gemini_key_index') || '0');

const updateKeyIndex = (newIndex: number) => {
  keyIndex = newIndex;
  localStorage.setItem('gemini_key_index', newIndex.toString());
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Internal helper to get keys and model name from Firestore
 */
export const getSettings = async () => {
  const settingsSnap = await getDoc(doc(db, 'settings', 'system'));
  const data = settingsSnap.exists() ? settingsSnap.data() : {};
  const keys: string[] = data.gemini_api_keys || (data.gemini_api_key ? [data.gemini_api_key] : []);
  const modelName = data.gemini_model || "gemini-2.0-flash";
  
  if (keys.length === 0) {
    throw new Error("Gemini API keys are not configured in Admin Settings.");
  }
  
  return { keys, modelName };
};

/**
 * Checks if an error is a rate limit (429) or quota error
 */
export const isRetryableAIError = (error: any): boolean => {
  const msg = String(error).toLowerCase();
  return msg.includes('429') || msg.includes('quota') || msg.includes('limit') || msg.includes('too many requests');
};

/**
 * Executes an AI task with automatic fallback to other keys.
 * Cycles through ALL keys up to 2 full times if rate limits are hit.
 */
export const runWithAIFallback = async <T>(
  task: (model: any, modelName: string) => Promise<T>
): Promise<T> => {
  const { keys, modelName } = await getSettings();
  let lastError: any = null;
  
  // Try every key in the list twice (two full cycles)
  const maxAttempts = keys.length * 2;

  for (let i = 0; i < maxAttempts; i++) {
    // Calculate index based on global keyIndex to maintain round-robin across different calls
    const currentIndex = (keyIndex + i) % keys.length;
    const selectedKey = keys[currentIndex];
    
    try {
      const genAI = new GoogleGenerativeAI(selectedKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await task(model, modelName);
      
      // SUCCESS: Update the global index to the NEXT key for the next request
      updateKeyIndex((currentIndex + 1) % keys.length);
      return result;
    } catch (error: any) {
      lastError = error;
      console.warn(`[AI_FALLBACK] Key ${currentIndex + 1}/${keys.length} failed (Attempt ${i + 1}/${maxAttempts}):`, error.message || error);
      
      if (isRetryableAIError(error)) {
        // If we've finished one full cycle and are starting the second, wait a moment
        if (i === keys.length - 1) {
          await sleep(1500);
        }
        continue;
      } else {
        // If it's a structural error (e.g. invalid prompt), don't bother retrying other keys
        throw error;
      }
    }
  }

  throw new Error(`Exhausted all ${keys.length} Gemini API keys after multiple cycles. Last error: ${lastError?.message || 'Unknown'}`);
};

/**
 * Legacy support for components that just need a single model instance.
 */
export const getAIConfiguration = async () => {
  const { keys, modelName } = await getSettings();
  const currentIndex = keyIndex % keys.length;
  const selectedKey = keys[currentIndex];
  
  const genAI = new GoogleGenerativeAI(selectedKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  return { genAI, model, modelName, keysCount: keys.length };
};