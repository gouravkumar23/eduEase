"use client";

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Hash, Search, Users, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  description: string;
  faculty_name: string;
}

export default function RoomJoin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'room_members'), where('student_id', '==', user.id));
    const unsubscribe = onSnapshot(q, async (snap) => {
      // Use a Set to ensure unique room IDs and prevent duplicate key warnings
      const roomIds = Array.from(new Set(snap.docs.map(d => d.data().room_id)));
      const roomsData: Room[] = [];
      
      for (const id of roomIds) {
        const rDoc = await getDoc(doc(db, 'rooms', id));
        if (rDoc.exists()) {
          roomsData.push({ id: rDoc.id, ...rDoc.data() } as Room);
        }
      }
      
      setMyRooms(roomsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !code.trim()) return;
    setJoining(true);
    setError('');

    try {
      const q = query(
        collection(db, 'rooms'), 
        where('code', '==', code.toUpperCase().trim()),
        where('status', '==', 'approved')
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setError('Invalid or unapproved room code.');
        return;
      }

      const room = snap.docs[0];
      
      const memberQ = query(
        collection(db, 'room_members'),
        where('room_id', '==', room.id),
        where('student_id', '==', user.id)
      );
      const memberSnap = await getDocs(memberQ);

      if (!memberSnap.empty) {
        setError('You are already a member of this room.');
        return;
      }

      await addDoc(collection(db, 'room_members'), {
        room_id: room.id,
        student_id: user.id,
        joined_at: serverTimestamp()
      });

      setCode('');
      alert(`Successfully joined ${room.data().name}`);
    } catch (err) {
      setError('Failed to join room.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-600 text-white rounded-xl">
            <Hash size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Join a Room</h2>
        </div>
        
        <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit Room Code"
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold uppercase tracking-widest"
              maxLength={6}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={joining || code.length < 6}
            className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {joining ? <Loader2 className="animate-spin" size={20} /> : 'Join Room'}
            <ArrowRight size={20} />
          </button>
        </form>
        {error && (
          <div className="mt-4 flex items-center gap-2 text-rose-600 text-sm font-bold bg-rose-50 p-3 rounded-xl border border-rose-100">
            <AlertCircle size={16} /> {error}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Users size={20} className="text-indigo-600" />
          My Enrolled Rooms
        </h3>
        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading your rooms...</div>
        ) : myRooms.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <Users className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500">You haven't joined any rooms yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myRooms.map(room => (
              <button 
                key={room.id} 
                onClick={() => navigate(`/room/${room.id}`)}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{room.name}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Faculty: {room.faculty_name}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2">{room.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}