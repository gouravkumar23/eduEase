"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, getDocs } from 'firebase/firestore';
import { Plus, Users, Hash, ShieldAlert, X, Loader2, UserPlus, MessageSquare, Share2, Copy, Check, UserCheck } from 'lucide-react';
import BulkMemberAssignment from './BulkMemberAssignment';
import RoomChat from './RoomChat';
import RoomMembersModal from './RoomMembersModal';

interface Room {
  id: string;
  name: string;
  description: string;
  code: string;
  faculty_id: string;
  status: 'pending' | 'approved' | 'rejected';
  chatEnabled: boolean;
  created_at: any;
}

export default function RoomManager() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [assigningRoom, setAssigningRoom] = useState<Room | null>(null);
  const [viewingMembersRoom, setViewingMembersRoom] = useState<Room | null>(null);
  const [chatRoom, setChatRoom] = useState<Room | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'rooms'), where('faculty_id', '==', user.id));
    const unsubscribe = onSnapshot(q, (snap) => {
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Room[]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);

    try {
      const code = generateRoomCode();
      const q = query(collection(db, 'rooms'), where('code', '==', code));
      const existing = await getDocs(q);
      if (!existing.empty) {
        handleCreate(e);
        return;
      }

      await addDoc(collection(db, 'rooms'), {
        name,
        description,
        code,
        faculty_id: user.id,
        faculty_name: user.name,
        status: 'pending',
        chatEnabled: false,
        created_at: serverTimestamp()
      });

      // Notify Admins
      const adminsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
      for (const adminDoc of adminsSnap.docs) {
        await addDoc(collection(db, 'notifications'), {
          userId: adminDoc.id,
          title: 'New Room Request',
          message: `Faculty ${user.name} requested a new room: "${name}".`,
          link: '/admin',
          read: false,
          timestamp: serverTimestamp(),
          type: 'info'
        });
      }

      setName('');
      setDescription('');
      setShowCreate(false);
    } catch (error) {
      alert('Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return <div className="py-12 text-center text-slate-500">Loading rooms...</div>;

  return (
    <div className="space-y-6">
      {assigningRoom && (
        <BulkMemberAssignment 
          roomId={assigningRoom.id} 
          roomName={assigningRoom.name} 
          onClose={() => setAssigningRoom(null)} 
        />
      )}

      {viewingMembersRoom && (
        <RoomMembersModal 
          roomId={viewingMembersRoom.id} 
          roomName={viewingMembersRoom.name} 
          onClose={() => setViewingMembersRoom(null)} 
        />
      )}

      {chatRoom && (
        <RoomChat 
          roomId={chatRoom.id} 
          roomName={chatRoom.name} 
          role="faculty" 
          onClose={() => setChatRoom(null)} 
        />
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Exam Rooms</h2>
          <p className="text-slate-500 text-sm">Create private spaces for specific student groups.</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
        >
          <Plus size={18} /> Create Room
        </button>
      </div>

      {showCreate && (
        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900">New Room Details</h3>
            <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Room Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. CS-301 Section A"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Description</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Briefly describe the purpose of this room..."
                rows={3}
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={creating}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {creating ? <Loader2 className="animate-spin" size={20} /> : 'Submit for Approval'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rooms.map(room => (
          <div key={room.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{room.name}</h3>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    room.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                    room.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {room.status}
                  </span>
                </div>
              </div>
              {room.status === 'approved' && (
                <div className="flex flex-col items-end gap-2">
                  <div className="bg-slate-900 text-white px-3 py-1 rounded-lg flex items-center gap-2">
                    <Hash size={14} className="text-indigo-400" />
                    <span className="text-xs font-mono font-bold">{room.code}</span>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => copyToClipboard(room.code, `code-${room.id}`)}
                      className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all"
                      title="Copy Code"
                    >
                      {copiedId === `code-${room.id}` ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                    <button 
                      onClick={() => copyToClipboard(`${window.location.origin}/#/join/room/${room.id}`, `link-${room.id}`)}
                      className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all"
                      title="Copy Invite Link"
                    >
                      {copiedId === `link-${room.id}` ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">{room.description}</p>
            
            {room.status === 'approved' ? (
              <div className="pt-4 border-t border-slate-50 grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setAssigningRoom(room)}
                  className="flex flex-col items-center justify-center gap-1 bg-indigo-50 text-indigo-600 py-2 rounded-xl text-[10px] font-bold hover:bg-indigo-600 hover:text-white transition-all"
                >
                  <UserPlus size={16} />
                  Add
                </button>
                <button 
                  onClick={() => setViewingMembersRoom(room)}
                  className="flex flex-col items-center justify-center gap-1 bg-slate-100 text-slate-600 py-2 rounded-xl text-[10px] font-bold hover:bg-slate-200 transition-all"
                >
                  <UserCheck size={16} />
                  Members
                </button>
                <button 
                  onClick={() => setChatRoom(room)}
                  className="flex flex-col items-center justify-center gap-1 bg-slate-900 text-white py-2 rounded-xl text-[10px] font-bold hover:bg-slate-800 transition-all"
                >
                  <MessageSquare size={16} />
                  Chat
                </button>
              </div>
            ) : room.status === 'pending' && (
              <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600 bg-amber-50 p-2 rounded-lg">
                <ShieldAlert size={14} />
                Awaiting administrator approval to generate access code.
              </div>
            )}
          </div>
        ))}
        {rooms.length === 0 && !showCreate && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Users className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500">No rooms created yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}