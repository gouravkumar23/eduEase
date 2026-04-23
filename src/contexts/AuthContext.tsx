import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signInWithPopup
} from 'firebase/auth';
import { 
  doc, getDoc, setDoc, updateDoc, serverTimestamp, deleteDoc, 
  Timestamp, increment, onSnapshot, getDocs, query, where, collection, addDoc 
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { templates } from '../utils/emailTemplates';
import { generateOTP, hashOTP, isExpired } from '../utils/otp';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'faculty' | 'student' | 'admin';
  status: 'active' | 'pending' | 'blocked';
  emailVerified: boolean;
  isVerified: boolean;
  rollNumber?: string;
  branch?: string;
  year?: string;
  section?: string;
  dob?: string;
  activeSessionId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, requiredRole: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  register: (email: string, password: string, name: string, role: string, extraData?: any) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  requestProfileUpdate: (data: Partial<User>) => Promise<void>;
  sendOTP: (email: string, type: 'signup' | 'profile_edit', forceNew?: boolean, uid?: string) => Promise<boolean>;
  verifyOTP: (email: string, code: string) => Promise<boolean>;
  logout: () => void;
  setSessionError: (msg: string | null) => void;
  resetPassword: (email: string) => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  completeMagicLinkSignIn: (email: string) => Promise<void>;
  loading: boolean;
  sessionError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeDoc) unsubscribeDoc();

      if (firebaseUser) {
        unsubscribeDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data() as any;
            
            if (userData.status === 'blocked') {
              signOut(auth);
              setUser(null);
              setLoading(false);
              return;
            }

            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              emailVerified: userData.isVerified === true || firebaseUser.emailVerified === true,
              isVerified: userData.isVerified === true,
              ...userData
            });
          } else {
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              emailVerified: firebaseUser.emailVerified,
              isVerified: false,
              name: firebaseUser.displayName || 'User',
              role: 'student',
              status: 'active'
            });
          }
          setLoading(false);
        }, (error) => {
          console.error("User doc listener error:", error);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const sendOTP = async (email: string, type: 'signup' | 'profile_edit', forceNew = false, uid?: string): Promise<boolean> => {
    const normalizedEmail = email.toLowerCase().trim();
    
    const settingsSnap = await getDoc(doc(db, 'settings', 'system'));
    const quizBackendUrl = settingsSnap.exists() ? settingsSnap.data().email_service_url : null;
    
    if (!quizBackendUrl) {
      console.warn('[OTP_SKIP] No backend relay URL configured.');
      return false;
    }

    const otpRef = doc(db, 'otps', normalizedEmail);
    const trackingRef = doc(db, 'otp_tracking', normalizedEmail);

    if (!forceNew) {
      const existingOtpSnap = await getDoc(otpRef);
      if (existingOtpSnap.exists()) {
        const data = existingOtpSnap.data();
        if (!isExpired(data.otpExpiry)) return true;
      }
    }

    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);
    const rawToken = crypto.randomUUID();
    const hashedToken = await hashOTP(rawToken);
    const expiry = new Date(Date.now() + 15 * 60000);

    await Promise.all([
      setDoc(otpRef, {
        email: normalizedEmail,
        otpHash: hashedOtp,
        type,
        otpExpiry: Timestamp.fromDate(expiry),
        attemptCount: 0,
        created_at: serverTimestamp()
      }),
      uid ? updateDoc(doc(db, 'users', uid), {
        verificationToken: hashedToken,
        verificationTokenExpiry: Timestamp.fromDate(expiry)
      }) : Promise.resolve(),
      setDoc(trackingRef, {
        email: normalizedEmail,
        otpSentAt: serverTimestamp(),
        type
      })
    ]);

    const verificationLink = `${window.location.origin}/#/verify?token=${rawToken}`;

    try {
      const res = await fetch(`${quizBackendUrl}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: normalizedEmail,
          subject: 'Your EduEase Verification Code',
          html: templates.otp(otp, verificationLink),
          text: `Your verification code is ${otp}. Link: ${verificationLink}`,
          isOTP: true
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to send verification email');
      }

      return res.ok;
    } catch (e: any) {
      console.error('[OTP_RELAY_ERROR]', e);
      throw e;
    }
  };

  const verifyOTP = async (email: string, code: string): Promise<boolean> => {
    const normalizedEmail = email.toLowerCase().trim();
    const otpRef = doc(db, 'otps', normalizedEmail);
    const otpSnap = await getDoc(otpRef);

    if (!otpSnap.exists()) throw new Error('No active verification code found.');

    const data = otpSnap.data();
    if (data.attemptCount >= 5) {
      await deleteDoc(otpRef);
      throw new Error('Too many failed attempts.');
    }

    if (isExpired(data.otpExpiry)) {
      await deleteDoc(otpRef);
      throw new Error('Verification code has expired.');
    }

    const hashedInput = await hashOTP(code);
    if (data.otpHash !== hashedInput) {
      await updateDoc(otpRef, { attemptCount: increment(1) });
      throw new Error(`Invalid code. ${4 - data.attemptCount} attempts remaining.`);
    }

    const userQ = query(collection(db, 'users'), where('email', '==', normalizedEmail));
    const userSnap = await getDocs(userQ);
    if (!userSnap.empty) {
      await updateDoc(userSnap.docs[0].ref, { 
        isVerified: true,
        verifiedAt: serverTimestamp()
      });
    }

    await deleteDoc(otpRef);
    return true;
  };

  const login = async (email: string, password: string, requiredRole: string) => {
    setSessionError(null);
    const normalizedEmail = email.toLowerCase().trim();
    const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    const uid = userCredential.user.uid;
    const userDocRef = doc(db, 'users', uid);
    let userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        email: normalizedEmail,
        name: userCredential.user.displayName || 'User',
        role: requiredRole as any,
        status: requiredRole === 'faculty' ? 'pending' : 'active',
        isVerified: userCredential.user.emailVerified,
        created_at: serverTimestamp()
      });
      userDoc = await getDoc(userDocRef);
    }

    const userData = userDoc.data()!;
    if (userData.role !== requiredRole) {
      await signOut(auth);
      throw new Error(`Access denied. This account is registered as a ${userData.role}.`);
    }

    if (userData.status === 'blocked') {
      await signOut(auth);
      throw new Error('Your account has been blocked.');
    }

    if (userData.isVerified !== true) {
      if (userCredential.user.emailVerified) {
        await updateDoc(userDocRef, { isVerified: true });
      } else {
        await sendOTP(normalizedEmail, 'signup', true, uid);
        throw new Error('Email not verified. A new code has been sent.');
      }
    }

    const sessionId = Date.now().toString();
    localStorage.setItem("sessionId", sessionId);

    await updateDoc(userDocRef, { 
      activeSessionId: sessionId,
      lastLoginAt: serverTimestamp()
    });
  };

  const signInWithGoogle = async () => {
    setSessionError(null);
    const userCredential = await signInWithPopup(auth, googleProvider);
    const firebaseUser = userCredential.user;
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    const sessionId = Date.now().toString();
    localStorage.setItem("sessionId", sessionId);

    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        email: firebaseUser.email?.toLowerCase(),
        name: firebaseUser.displayName || 'Google User',
        role: 'student',
        status: 'active',
        isVerified: true,
        activeSessionId: sessionId,
        lastLoginAt: serverTimestamp(),
        created_at: serverTimestamp()
      });
    } else {
      const userData = userDoc.data();
      if (userData.status === 'blocked') {
        await signOut(auth);
        throw new Error('Your account has been blocked.');
      }
      await updateDoc(userDocRef, {
        activeSessionId: sessionId,
        lastLoginAt: serverTimestamp(),
        isVerified: true 
      });
    }
  };

  const register = async (email: string, password: string, name: string, role: string, extraData: any = {}) => {
    setSessionError(null);
    const normalizedEmail = email.toLowerCase().trim();
    const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    const firebaseUser = userCredential.user;
    
    const sessionId = Date.now().toString();
    localStorage.setItem("sessionId", sessionId);
    
    const userData = {
      email: normalizedEmail,
      name,
      role,
      status: role === 'faculty' ? 'pending' : 'active',
      isVerified: false,
      activeSessionId: sessionId,
      lastLoginAt: serverTimestamp(),
      ...extraData,
      created_at: serverTimestamp()
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userData);
    await sendOTP(normalizedEmail, 'signup', true, firebaseUser.uid);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.id), data);
  };

  const requestProfileUpdate = async (data: Partial<User>) => {
    if (!user) return;
    await addDoc(collection(db, 'profile_updates'), {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      currentData: {
        name: user.name,
        branch: user.branch || 'N/A',
        year: user.year || 'N/A',
        section: user.section || 'N/A'
      },
      requestedData: data,
      status: 'pending',
      timestamp: serverTimestamp()
    });
  };

  const logout = async () => {
    setSessionError(null);
    localStorage.removeItem("sessionId");
    return signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.toLowerCase().trim());
  };

  const sendMagicLink = (email: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    const actionCodeSettings = {
      url: window.location.origin + '/auth/callback',
      handleCodeInApp: true,
    };
    window.localStorage.setItem('emailForSignIn', normalizedEmail);
    return sendSignInLinkToEmail(auth, normalizedEmail, actionCodeSettings);
  };

  const completeMagicLinkSignIn = async (email: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const userCredential = await signInWithEmailLink(auth, normalizedEmail, window.location.href);
      const userDocRef = doc(db, 'users', userCredential.user?.uid || '');
      
      const sessionId = Date.now().toString();
      localStorage.setItem("sessionId", sessionId);
      
      await updateDoc(userDocRef, { 
        activeSessionId: sessionId,
        lastLoginAt: serverTimestamp(),
        isVerified: true 
      });
      window.localStorage.removeItem('emailForSignIn');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, login, signInWithGoogle, register, updateProfile, requestProfileUpdate, sendOTP, verifyOTP, logout, 
      setSessionError, resetPassword, sendMagicLink, completeMagicLinkSignIn, loading, sessionError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};