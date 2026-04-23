"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { ShieldAlert, Search, Calendar, FileText, Maximize2, CameraOff, Loader2, AlertCircle } from 'lucide-react';
import ViolationDetailModal from './ViolationDetailModal';

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
}

export default function FacultyViolations() {
  const { user } = useAuth();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);

  useEffect(() => {
    if (!user) return;

    // Ensure we have a facultyId filter and order by timestamp
    const q = query(
      collection(db, 'violations'),
      where('facultyId', '==', user.id),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Violation[];
      setViolations(data);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Violations fetch error:", err);
      setError("Failed to load integrity logs. Please ensure you have the necessary permissions.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredViolations = violations.filter(v => 
    v.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.examName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="py-12 text-center text-slate-500">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
      <p className="font-medium">Loading integrity logs...</p>
    </div>
  );

  if (error) return (
    <div className="py-12 text-center max-w-md mx-auto">
      <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-slate-900 mb-2">Connection Error</h3>
      <p className="text-slate-500 text-sm">{error}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Detail Modal */}
      {selectedViolation && (
        <ViolationDetailModal 
          violation={selectedViolation} 
          onClose={() => setSelectedViolation(null)} 
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <ShieldAlert className="text-rose-500" />
            Integrity Violations
          </h2>
          <p className="text-slate-500 text-sm">Review proctoring alerts and photographic evidence from your assessments.</p>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by student, exam, or violation type..." 
          className="flex-1 outline-none text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredViolations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <ShieldAlert className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-900">No violations recorded</h3>
          <p className="text-slate-500">All students are currently following the examination rules.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredViolations.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all group">
              <div className="flex flex-col md:flex-row">
                {/* Evidence Preview */}
                <div className="w-full md:w-48 h-48 md:h-auto bg-slate-100 relative shrink-0">
                  {v.imageUrl ? (
                    <>
                      <img 
                        src={v.imageUrl} 
                        alt="Evidence" 
                        className="w-full h-full object-cover"
                      />
                      <button 
                        onClick={() => setSelectedViolation(v)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-bold text-xs"
                      >
                        <Maximize2 size={16} /> View Details
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                      <CameraOff size={32} className="opacity-20" />
                      <span className="text-[10px] font-bold uppercase">No Image</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 p-6">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                          v.type === 'TAB_SWITCH' ? 'bg-amber-100 text-amber-700' :
                          v.type === 'NO_FACE' ? 'bg-rose-100 text-rose-700' :
                          'bg-indigo-100 text-indigo-700'
                        }`}>
                          {v.type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Calendar size={12} />
                          {v.timestamp?.toDate().toLocaleString()}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{v.studentName}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {v.status && v.status !== 'pending' && (
                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg border uppercase tracking-widest ${
                          v.status === 'confirmed' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                          v.status === 'false_positive' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                          {v.status.replace('_', ' ')}
                        </span>
                      )}
                      <button 
                        onClick={() => setSelectedViolation(v)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      >
                        <Maximize2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <FileText size={16} className="text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Assessment</p>
                        <p className="font-medium">{v.examName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <ShieldAlert size={16} className="text-rose-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Reason</p>
                        <p className="font-medium line-clamp-1">{v.details}</p>
                      </div>
                    </div>
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