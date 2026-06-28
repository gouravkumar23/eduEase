/**
 * OTP Utility for EduEase
 * Handles generation and secure hashing of verification codes.
 */

export const generateOTP = (): string => {
  // Generates a random number between 100,000 and 999,999
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashOTP = async (otp: string): Promise<string> => {
  const msgUint8 = new TextEncoder().encode(otp);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const isExpired = (timestamp: any): boolean => {
  if (!timestamp) return true;
  const expiry = timestamp.toDate ? timestamp.toDate().getTime() : new Date(timestamp).getTime();
  return Date.now() > expiry;
};