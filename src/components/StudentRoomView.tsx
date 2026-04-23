"use client";

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  ArrowLeft, 
  MessageSquare, 
  Users, 
  Loader2
} from 'lucide-react';
import RoomChat from './RoomChat';
import RoomMembersList from './RoomMembersList';

export default function StudentRoomView() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  useAuth();
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'members'>('chat');

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = onSnapshot(doc(db, 'rooms', roomId), (docSnap) => {
      if (docSnap.exists()) {
        setRoom({ id: docSnap.id, ...docSnap.data() });
      } else {
        navigate('/student');
      }
      setLoading(false);
    }, (err) => {
      console.error("Room fetch error:", err);
      navigate('/student');
    });

    return () => unsubscribe();
  }, [roomId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse">Loading Room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/student')}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-black text-slate-900 leading-tight">{room?.name}</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Faculty: {room?.faculty_name}
              </p>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'chat' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <MessageSquare size={14} />
              Chat
            </button>
            <button 
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'members' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users size={14} />
              Members
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto flex flex-col overflow-hidden">
        <div className="flex-1 bg-white shadow-sm border-x border-slate-200 overflow-hidden flex flex-col">
          {activeTab === 'chat' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <RoomChat 
                roomId={room.id} 
                roomName={room.name} 
                role="student" 
                onClose={() => navigate('/student')} 
                isInline={true}
              />
            </div>
          ) : (
            <RoomMembersList roomId={room.id} />
          )}
        </div>
      </main>
    </div>
  );
}