"use client";

import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Users, X, UserMinus, Loader2, Search, Mail, Hash } from 'lucide-react';

interface Member {
  id: string; // membership doc id
  student_id: string;
  name: string;
  email: string;
  rollNumber?: string;
  joined_at: any;
}

interface RoomMembersModalProps {
  roomId: string;
  roomName: string;
  onClose: () => void;
}

export default function RoomMembersModal({ roomId, roomName, onClose }: RoomMembersModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const membersRef = collection(db, 'room_members');
    const q = query(membersRef, where('room_id', '==', roomId));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const memberList: Member[] = [];
      
      for (const memberDoc of snapshot.docs) {
        const data = memberDoc.data();
        const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', data.student_id)));
        
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          memberList.push({
            id: memberDoc.id,
            student_id: data.student_id,
            name: userData.name || 'Unknown',
            email: userData.email || 'N/A',
            rollNumber: userData.rollNumber,
            joined_at: data.joined_at
          });
        }
      }
      
      setMembers(memberList.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  const handleRemove = async (membershipId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to remove ${studentName} from this room?`)) return;
    
    setProcessingId(membershipId);
    try {
      await deleteDoc(doc(db, 'room_members', membershipId));
    } catch (error) {
      alert('Failed to remove member');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Users size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Room Members</h3>
              <p className="text-indigo-100 text-xs">{roomName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b bg-slate-50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, email, or roll number..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Users size={48} className="mb-2 opacity-20" />
              <p className="text-sm font-medium">No members found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold shrink-0">
                      {member.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{member.name}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Mail size={10} /> {member.email}
                        </span>
                        {member.rollNumber && (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Hash size={10} /> {member.rollNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemove(member.id, member.name)}
                    disabled={processingId === member.id}
                    className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    title="Remove from Room"
                  >
                    {processingId === member.id ? <Loader2 size={18} className="animate-spin" /> : <UserMinus size={18} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Total Members: {members.length}
          </p>
        </div>
      </div>
    </div>
  );
}