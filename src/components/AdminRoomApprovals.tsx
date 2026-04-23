"use client";

import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { Users, Check, X, Loader2 } from 'lucide-react';

interface RoomRequest {
  id: string;
  name: string;
  description: string;
  faculty_id: string;
  faculty_name: string;
  status: string;
  created_at: any;
}

export default function AdminRoomApprovals() {
  const [requests, setRequests] = useState<RoomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'rooms'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })) as RoomRequest[]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAction = async (req: RoomRequest, status: 'approved' | 'rejected') => {
    setProcessingId(req.id);
    try {
      await updateDoc(doc(db, 'rooms', req.id), {
        status,
        updated_at: serverTimestamp()
      });

      // Notify Faculty
      await addDoc(collection(db, 'notifications'), {
        userId: req.faculty_id,
        title: `Room Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        message: `Your request for room "${req.name}" has been ${status}.`,
        link: '/faculty',
        read: false,
        timestamp: serverTimestamp(),
        type: status === 'approved' ? 'success' : 'error'
      });

    } catch (error) {
      alert('Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="py-12 text-center text-slate-500">Loading requests...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
          <Users size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Room Approvals</h2>
          <p className="text-slate-500 text-sm">Review and approve faculty requests for new exam rooms.</p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Check className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-900">No pending requests</h3>
          <p className="text-slate-500">All room creation requests have been processed.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Room Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Faculty</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.map(req => (
                <tr key={req.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm text-slate-900">{req.name}</div>
                    <div className="text-xs text-slate-500 line-clamp-1">{req.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-700">{req.faculty_name}</div>
                    <div className="text-[10px] text-slate-400">Requested {req.created_at?.toDate().toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleAction(req, 'approved')}
                        disabled={processingId === req.id}
                        className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition-colors"
                      >
                        {processingId === req.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        Approve
                      </button>
                      <button 
                        onClick={() => handleAction(req, 'rejected')}
                        disabled={processingId === req.id}
                        className="flex items-center gap-1.5 bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-rose-100 transition-colors"
                      >
                        <X size={14} />
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}