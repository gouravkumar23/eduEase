"use client";

import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, limit, deleteDoc, doc } from 'firebase/firestore';
import { 
  Search, 
  Calendar, 
  FileText, 
  Maximize2, 
  CameraOff, 
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Download,
  Trash2,
  Loader2
} from 'lucide-react';
import ViolationDetailModal from './ViolationDetailModal';
import * as XLSX from 'xlsx';

interface Violation {
  id: string;
  studentName: string;
  studentId: string;
  examName: string;
  examId: string;
  facultyId: string;
  type: string;
  timestamp: any;
  imageUrl: string | null;
  details: string;
  status?: 'pending' | 'reviewed' | 'confirmed' | 'false_positive';
}

export default function AdminViolations() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExam, setFilterExam] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'violations'),
      orderBy('timestamp', 'desc'),
      limit(200)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setViolations(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Violation[]);
      setLoading(false);
    }, (error) => {
      console.error("Admin violations fetch error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleExport = () => {
    const data = violations.map(v => ({
      'Student Name': v.studentName,
      'Student ID': v.studentId,
      'Assessment': v.examName,
      'Violation Type': v.type,
      'Details': v.details,
      'Status': v.status || 'pending',
      'Timestamp': v.timestamp?.toDate ? v.timestamp.toDate().toLocaleString() : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Violation Activity");
    XLSX.writeFile(workbook, "EduEase_Violation_Report.xlsx");
  };

  const handleDeleteViolation = async (id: string) => {
    if (!confirm('Are you sure you want to remove this violation record from the dashboard?')) return;
    setProcessingId(id);
    try {
      await deleteDoc(doc(db, 'violations', id));
    } catch (error) {
      alert('Failed to delete record');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredViolations = violations.filter(v => {
    const matchesSearch = v.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExam = v.examName.toLowerCase().includes(filterExam.toLowerCase());
    
    let matchesDate = true;
    if (filterDate) {
      const vDate = v.timestamp?.toDate().toISOString().split('T')[0];
      matchesDate = vDate === filterDate;
    }

    return matchesSearch && matchesExam && matchesDate;
  });

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'confirmed': return <AlertCircle size={14} className="text-rose-500" />;
      case 'false_positive': return <XCircle size={14} className="text-emerald-500" />;
      case 'reviewed': return <CheckCircle2 size={14} className="text-blue-500" />;
      default: return <Clock size={14} className="text-slate-300" />;
    }
  };

  if (loading) return (
    <div className="py-12 text-center">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-slate-500 font-medium">Loading global integrity logs...</p>
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

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Integrity Dashboard</h2>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Download size={18} />
          Export Activity Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-400 mb-2">
          <Filter size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">Filter Logs</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search student..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter by exam..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={filterExam}
              onChange={(e) => setFilterExam(e.target.value)}
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="date" 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Evidence</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assessment</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Violation</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredViolations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                    No violations found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredViolations.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="w-16 h-10 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                        {v.imageUrl ? (
                          <img src={v.imageUrl} className="w-full h-full object-cover" alt="Thumb" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <CameraOff size={14} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">{v.studentName}</div>
                      <div className="text-[10px] text-slate-400 font-medium">ID: {v.studentId.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 font-medium line-clamp-1">{v.examName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                        v.type === 'TAB_SWITCH' ? 'bg-amber-100 text-amber-700' :
                        v.type === 'NO_FACE' ? 'bg-rose-100 text-rose-700' :
                        'bg-indigo-100 text-indigo-700'
                      }`}>
                        {v.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2" title={v.status || 'pending'}>
                        {getStatusIcon(v.status)}
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {(v.status || 'pending').replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock size={12} />
                        {v.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {v.timestamp?.toDate().toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => setSelectedViolation(v)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="View Details"
                        >
                          <Maximize2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteViolation(v.id)}
                          disabled={processingId === v.id}
                          className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="Remove Record"
                        >
                          {processingId === v.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}