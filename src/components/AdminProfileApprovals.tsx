"use client";

import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { UserCircle, Check, X, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { notifyEvent } from '../utils/notifications';

interface ProfileUpdate {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  currentData: {
    name: string;
    branch: string;
    year: string;
    section: string;
  };
  requestedData: {
    name: string;
    branch: string;
    year: string;
    section: string;
  };
  status: string;
  timestamp: any;
}

export default function AdminProfileApprovals() {
  const [requests, setRequests] = useState<ProfileUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'profile_updates'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ProfileUpdate[]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAction = async (req: ProfileUpdate, action: 'approve' | 'reject') => {
    setProcessingId(req.id);
    try {
      if (action === 'approve') {
        // Update User Document
        await updateDoc(doc(db, 'users', req.userId), {
          ...req.requestedData,
          updated_at: serverTimestamp()
        });

        // Notify Student
        await notifyEvent({
          type: 'success',
          title: 'Profile Update Approved',
          message: 'Your profile changes have been verified and applied by the administrator.',
          userIds: [req.userId],
          link: '/student'
        });
      } else {
        // Notify Student of Rejection
        await notifyEvent({
          type: 'error',
          title: 'Profile Update Rejected',
          message: 'Your profile update request was rejected. Please contact administration if you believe this is an error.',
          userIds: [req.userId],
          link: '/student'
        });
      }

      // Delete the request record
      await deleteDoc(doc(db, 'profile_updates', req.id));

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
          <UserCircle size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Profile Update Requests</h2>
          <p className="text-slate-500 text-sm">Verify and approve student identity changes.</p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Check className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-900">No pending requests</h3>
          <p className="text-slate-500">All profile update requests have been processed.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                        {req.userName[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{req.userName}</h3>
                        <p className="text-xs text-slate-500">{req.userEmail}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Data</p>
                        <div className="space-y-1 text-xs font-bold text-slate-600">
                          <p>Name: {req.currentData.name}</p>
                          <p>Branch: {req.currentData.branch}</p>
                          <p>Year: {req.currentData.year}</p>
                          <p>Section: {req.currentData.section}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Requested Changes</p>
                        <div className="space-y-1 text-xs font-bold text-indigo-700">
                          <p className={req.currentData.name !== req.requestedData.name ? 'text-indigo-900' : ''}>
                            Name: {req.requestedData.name}
                          </p>
                          <p className={req.currentData.branch !== req.requestedData.branch ? 'text-indigo-900' : ''}>
                            Branch: {req.requestedData.branch}
                          </p>
                          <p className={req.currentData.year !== req.requestedData.year ? 'text-indigo-900' : ''}>
                            Year: {req.requestedData.year}
                          </p>
                          <p className={req.currentData.section !== req.requestedData.section ? 'text-indigo-900' : ''}>
                            Section: {req.requestedData.section}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-2 min-w-[140px]">
                    <button 
                      onClick={() => handleAction(req, 'approve')}
                      disabled={processingId === req.id}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
                    >
                      {processingId === req.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Approve Changes
                    </button>
                    <button 
                      onClick={() => handleAction(req, 'reject')}
                      disabled={processingId === req.id}
                      className="w-full flex items-center justify-center gap-2 bg-rose-50 text-rose-600 py-2.5 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all disabled:opacity-50"
                    >
                      <X size={14} />
                      Reject Request
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}