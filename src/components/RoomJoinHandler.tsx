"use client";

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function RoomJoinHandler() {
  const { roomId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleJoin = async () => {
      if (authLoading || !roomId) return;

      if (!user) {
        localStorage.setItem('pendingRoomId', roomId);
        navigate('/auth');
        return;
      }

      if (user.role !== 'student') {
        setError('Only students can join exam rooms via invitation links.');
        setStatus('error');
        return;
      }

      try {
        // 1. Verify room exists and is approved
        const roomDoc = await getDoc(doc(db, 'rooms', roomId));
        if (!roomDoc.exists() || roomDoc.data().status !== 'approved') {
          setError('This room does not exist or is not yet approved by the administrator.');
          setStatus('error');
          return;
        }

        // 2. Check if already a member
        const memberQ = query(
          collection(db, 'room_members'),
          where('room_id', '==', roomId),
          where('student_id', '==', user.id)
        );
        const memberSnap = await getDocs(memberQ);

        if (!memberSnap.empty) {
          // Already a member, go straight to chat
          navigate(`/room/${roomId}`, { replace: true });
          return;
        }

        // 3. Join room
        await addDoc(collection(db, 'room_members'), {
          room_id: roomId,
          student_id: user.id,
          joined_at: serverTimestamp(),
          added_by: 'link'
        });

        setStatus('success');
        // Short delay to show success state before entering chat
        setTimeout(() => navigate(`/room/${roomId}`, { replace: true }), 1200);
      } catch (err) {
        console.error('Join error:', err);
        setError('Failed to join the room. Please try again.');
        setStatus('error');
      }
    };

    handleJoin();
  }, [user, authLoading, roomId, navigate]);

  if (status === 'loading' || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6 animate-pulse">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Entering Room...</h2>
        <p className="text-slate-500 mt-2">Verifying your invitation</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
          <AlertCircle size={40} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Unable to Join Room</h1>
        <p className="text-slate-500 mt-2 max-w-md leading-relaxed">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-8 flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all"
        >
          <ArrowLeft size={20} /> Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-6 shadow-sm animate-in zoom-in duration-300">
        <CheckCircle2 size={40} />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Successfully Joined!</h1>
      <p className="text-slate-500 mt-2">Redirecting you to the room chat...</p>
    </div>
  );
}