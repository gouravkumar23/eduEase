"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, updateDoc, deleteDoc, serverTimestamp, deleteField, doc } from 'firebase/firestore';
import { isExpired, hashOTP } from '../utils/otp';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export default function VerifyLinkHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your account...');

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link.');
        return;
      }

      try {
        // 1. Hash the received token for lookup
        const hashedToken = await hashOTP(token);
        console.log('[VERIFY] Attempting lookup for hashed token...');

        // 2. Find the user with this hashed verification token
        const q = query(collection(db, 'users'), where('verificationToken', '==', hashedToken));
        const snap = await getDocs(q);

        if (snap.empty) {
          // Check if user is already verified (maybe they clicked twice)
          console.warn('[VERIFY] Token not found. Checking if already verified...');
          setStatus('error');
          setMessage('Verification link is invalid or has already been used.');
          return;
        }

        const userDoc = snap.docs[0];
        const data = userDoc.data();

        // 3. Check expiry
        if (isExpired(data.verificationTokenExpiry)) {
          console.error('[VERIFY] Token expired.');
          await updateDoc(userDoc.ref, {
            verificationToken: deleteField(),
            verificationTokenExpiry: deleteField()
          });
          setStatus('error');
          setMessage('Verification link has expired. Please request a new one.');
          return;
        }

        // 4. Atomic update: Set verified status and clear token fields
        console.log('[VERIFY] Token valid. Updating user status...');
        await updateDoc(userDoc.ref, { 
          isVerified: true,
          verifiedAt: serverTimestamp(),
          verificationToken: deleteField(),
          verificationTokenExpiry: deleteField()
        });

        // 5. Cleanup: Delete any associated 6-digit OTP document for this email
        if (data.email) {
          await deleteDoc(doc(db, 'otps', data.email.toLowerCase()));
        }
        
        setStatus('success');
        setMessage('Account successfully verified!');
        
        setTimeout(() => {
          navigate('/');
        }, 2000);

      } catch (error) {
        console.error('[VERIFY_CRITICAL_ERROR]', error);
        setStatus('error');
        setMessage('An error occurred during verification.');
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-10 text-center animate-in fade-in zoom-in duration-300">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Verifying...</h1>
            <p className="text-slate-500">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Verified!</h1>
            <p className="text-slate-500 mb-8">{message}</p>
            <div className="flex items-center justify-center gap-2 text-indigo-600 font-bold animate-pulse">
              Redirecting to dashboard <ArrowRight size={18} />
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle size={40} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Verification Failed</h1>
            <p className="text-slate-500 mb-8">{message}</p>
            <button 
              onClick={() => navigate('/auth')}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}