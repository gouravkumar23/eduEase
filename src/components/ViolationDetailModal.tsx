"use client";

import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  ShieldAlert, 
  X, 
  CameraOff, 
  User, 
  Clock, 
  History,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Save,
  Loader2
} from 'lucide-react';

interface Violation {
  id: string;
  studentName: string;
  studentId: string;
  examName: string;
  examId: string;
  type: string;
  timestamp: any;
  imageUrl: string | null;
  details: string;
  status?: 'pending' | 'reviewed' | 'confirmed' | 'false_positive';
  facultyNote?: string;
}

interface ViolationDetailModalProps {
  violation: Violation;
  onClose: () => void;
}

export default function ViolationDetailModal({ violation, onClose }: ViolationDetailModalProps) {
  const [pastViolations, setPastViolations] = useState<Violation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [note, setNote] = useState(violation.facultyNote || '');
  const [status, setStatus] = useState(violation.status || 'pending');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!violation.studentId) return;

    const q = query(
      collection(db, 'violations'),
      where('studentId', '==', violation.studentId),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setPastViolations(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Violation[]);
      setLoadingHistory(false);
    });

    return () => unsubscribe();
  }, [violation.studentId]);

  const handleSaveResolution = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'violations', violation.id), {
        status,
        facultyNote: note,
        resolvedAt: serverTimestamp()
      });
      // We don't close the modal immediately so the user sees the success state
      setTimeout(() => setSaving(false), 500);
    } catch (error) {
      alert('Failed to save resolution');
      setSaving(false);
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'confirmed': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'false_positive': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'reviewed': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Violation Evidence</h3>
              <p className="text-xs text-slate-500">ID: {violation.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Evidence & Resolution */}
            <div className="lg:col-span-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden border-4 border-slate-100 shadow-inner relative group">
                  {violation.imageUrl ? (
                    <img src={violation.imageUrl} alt="Evidence" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                      <CameraOff size={48} className="opacity-20" />
                      <span className="text-sm font-bold uppercase">No Image Captured</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl">
                    <h4 className="text-xs font-black text-rose-600 uppercase tracking-widest mb-2">Violation Details</h4>
                    <p className="text-rose-900 font-medium leading-relaxed text-sm">{violation.details}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Student Information</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <User className="text-indigo-600" size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{violation.studentName}</p>
                        <p className="text-[10px] text-slate-500 truncate">ID: {violation.studentId.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resolution Section */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-indigo-600" />
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Resolution & Notes</h4>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg border uppercase tracking-widest ${getStatusColor(status)}`}>
                    {status.replace('_', ' ')}
                  </span>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Update Status</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'pending', label: 'Pending', icon: Clock },
                        { id: 'reviewed', label: 'Reviewed', icon: CheckCircle2 },
                        { id: 'confirmed', label: 'Confirmed Cheating', icon: AlertCircle },
                        { id: 'false_positive', label: 'False Positive', icon: X }
                      ].map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setStatus(s.id as any)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                            status === s.id 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' 
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <s.icon size={14} />
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                      <MessageSquare size={14} />
                      Faculty Internal Note
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add internal observations or justification for the resolution..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px] resize-none"
                    />
                  </div>

                  <button
                    onClick={handleSaveResolution}
                    disabled={saving}
                    className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? 'Saving Changes...' : 'Save Resolution'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Student History */}
            <div className="lg:col-span-4 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <History size={18} className="text-slate-400" />
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Student History (Last 10)</h4>
              </div>

              <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden flex flex-col">
                {loadingHistory ? (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : pastViolations.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <ShieldAlert size={32} className="text-slate-200 mb-2" />
                    <p className="text-xs text-slate-400 font-medium">No other violations recorded for this student.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 overflow-y-auto max-h-[500px]">
                    {pastViolations.map((pv) => (
                      <div key={pv.id} className={`p-4 transition-colors ${pv.id === violation.id ? 'bg-indigo-50/50' : 'hover:bg-white'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            pv.type === 'TAB_SWITCH' ? 'bg-amber-100 text-amber-700' :
                            pv.type === 'NO_FACE' ? 'bg-rose-100 text-rose-700' :
                            'bg-indigo-100 text-indigo-700'
                          }`}>
                            {pv.type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <Clock size={10} />
                            {pv.timestamp?.toDate().toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 line-clamp-1 mb-1">{pv.examName}</p>
                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{pv.details}</p>
                        {pv.status && pv.status !== 'pending' && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              pv.status === 'confirmed' ? 'bg-rose-500' : 
                              pv.status === 'false_positive' ? 'bg-emerald-500' : 'bg-blue-500'
                            }`} />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{pv.status.replace('_', ' ')}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-slate-50 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            EduEase Integrity Engine • Verified Evidence Log
          </p>
        </div>
      </div>
    </div>
  );
}