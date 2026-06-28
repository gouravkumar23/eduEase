"use client";

import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Plus, 
  X, 
  Loader2, 
  Check, 
  Users,
  Building2,
  Calendar
} from 'lucide-react';
import { db } from '../../../core/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { Institution } from '../../repositories/InstitutionRepository';

interface Announcement {
  id: string;
  title: string;
  message: string;
  target: 'everyone' | 'institution' | 'admins' | 'faculty' | 'students';
  targetInstitutionId?: string;
  timestamp: any;
}

export default function DevAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form States
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<Announcement['target']>('everyone');
  const [targetInst, setTargetInst] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [annSnap, instSnap] = await Promise.all([
        getDocs(query(collection(db, 'announcements'), orderBy('timestamp', 'desc'), limit(20))),
        getDocs(collection(db, 'institutions'))
      ]);

      setAnnouncements(annSnap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
      setInstitutions(instSnap.docs.map(d => d.data() as Institution));
    } catch (error) {
      console.error('Error fetching announcements data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await addDoc(collection(db, 'announcements'), {
        title,
        message,
        target,
        targetInstitutionId: target === 'institution' ? targetInst : '',
        timestamp: serverTimestamp()
      });

      alert('Announcement broadcasted successfully!');
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Failed to broadcast announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setTarget('everyone');
    setTargetInst('');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Announcements</h2>
          <p className="text-slate-400 text-sm">Broadcast global or targeted system announcements.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
        >
          <Plus size={18} /> Broadcast Announcement
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
            No announcements broadcasted yet.
          </div>
        ) : (
          announcements.map((ann) => {
            const inst = institutions.find(i => i.institutionId === ann.targetInstitutionId);
            return (
              <div key={ann.id} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded">
                      Target: {ann.target}
                    </span>
                    {ann.target === 'institution' && inst && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">
                        {inst.institutionName}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar size={12} />
                    {ann.timestamp?.toDate ? ann.timestamp.toDate().toLocaleDateString() : 'Just now'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white">{ann.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{ann.message}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h3 className="font-bold text-white text-lg">Broadcast Announcement</h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="Announcement Title"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Message</label>
                <textarea 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="Type your message here..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Target Audience</label>
                <select 
                  value={target} 
                  onChange={(e) => setTarget(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  <option value="everyone">Everyone</option>
                  <option value="institution">Specific Institution</option>
                  <option value="admins">All Admins</option>
                  <option value="faculty">All Faculty</option>
                  <option value="students">All Students</option>
                </select>
              </div>

              {target === 'institution' && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Select Institution</label>
                  <select 
                    value={targetInst} 
                    onChange={(e) => setTargetInst(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    required={target === 'institution'}
                  >
                    <option value="">Select Institution</option>
                    {institutions.map(inst => (
                      <option key={inst.institutionId} value={inst.institutionId}>{inst.institutionName}</option>
                    ))}
                  </select>
                </div>
              )}

              <button 
                type="submit" 
                disabled={submitting} 
                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                Broadcast Now
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}