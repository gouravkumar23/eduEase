"use client";

import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { Loader2, Search, Mail, Hash } from 'lucide-react';

interface Member {
  id: string;
  student_id: string;
  name: string;
  email: string;
  rollNumber?: string;
}

interface RoomMembersListProps {
  roomId: string;
}

export default function RoomMembersList({ roomId }: RoomMembersListProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
          });
        }
      }
      
      setMembers(memberList.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-slate-50/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search members..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredMembers.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-8">No members found.</p>
        ) : (
          filteredMembers.map((member) => (
            <div key={member.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold shrink-0">
                {member.name[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{member.name}</p>
                <div className="flex flex-wrap gap-x-2 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1"><Mail size={10} /> {member.email}</span>
                  {member.rollNumber && <span className="flex items-center gap-1"><Hash size={10} /> {member.rollNumber}</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="p-4 border-t bg-slate-50/50 text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Total Members: {members.length}
        </p>
      </div>
    </div>
  );
}