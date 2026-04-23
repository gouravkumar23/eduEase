"use client";

import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { Users, Loader2, X, Filter, PlusCircle } from 'lucide-react';

interface BulkMemberAssignmentProps {
  roomId: string;
  roomName: string;
  onClose: () => void;
}

const YEARS = ['1', '2', '3', '4'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

export default function BulkMemberAssignment({ roomId, roomName, onClose }: BulkMemberAssignmentProps) {
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const toggleFilter = (val: string, list: string[], setList: (l: string[]) => void) => {
    if (list.includes(val)) setList(list.filter(i => i !== val));
    else setList([...list, val]);
  };

  useEffect(() => {
    const updatePreview = async () => {
      if (selectedYears.length === 0 && selectedSections.length === 0) {
        setPreviewCount(null);
        return;
      }
      setLoadingPreview(true);
      try {
        const students = await fetchFilteredStudents();
        setPreviewCount(students.length);
      } finally {
        setLoadingPreview(false);
      }
    };
    const timer = setTimeout(updatePreview, 500);
    return () => clearTimeout(timer);
  }, [selectedYears, selectedSections]);

  const fetchFilteredStudents = async () => {
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'student'),
      where('status', '==', 'active')
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .filter(u => {
        const yearMatch = selectedYears.length === 0 || selectedYears.includes(u.year);
        const sectionMatch = selectedSections.length === 0 || selectedSections.includes(u.section);
        return yearMatch && sectionMatch;
      });
  };

  const handleBulkAdd = async () => {
    if (selectedYears.length === 0 && selectedSections.length === 0) return;
    setProcessing(true);

    try {
      const students = await fetchFilteredStudents();
      
      // Get existing members to avoid duplicates
      const membersQ = query(collection(db, 'room_members'), where('room_id', '==', roomId));
      const membersSnap = await getDocs(membersQ);
      const existingIds = new Set(membersSnap.docs.map(d => d.data().student_id));

      const newStudents = students.filter(s => !existingIds.has(s.id));

      if (newStudents.length === 0) {
        alert('All selected students are already members of this room.');
        setProcessing(false);
        return;
      }

      const batch = writeBatch(db);
      newStudents.forEach(student => {
        const ref = doc(collection(db, 'room_members'));
        batch.set(ref, {
          room_id: roomId,
          student_id: student.id,
          joined_at: serverTimestamp(),
          added_by: 'faculty'
        });
      });

      await batch.commit();
      alert(`Successfully added ${newStudents.length} students to ${roomName}`);
      onClose();
    } catch (error) {
      alert('Bulk assignment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Users size={24} />
            <div>
              <h3 className="font-bold">Bulk Member Assignment</h3>
              <p className="text-indigo-100 text-xs">{roomName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={24} /></button>
        </div>

        <div className="p-6 space-y-8">
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              <Filter size={14} /> Select Years
            </label>
            <div className="flex flex-wrap gap-2">
              {YEARS.map(y => (
                <button
                  key={y}
                  onClick={() => toggleFilter(y, selectedYears, setSelectedYears)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    selectedYears.includes(y) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Year {y}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              <Filter size={14} /> Select Sections
            </label>
            <div className="flex flex-wrap gap-2">
              {SECTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => toggleFilter(s, selectedSections, setSelectedSections)}
                  className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                    selectedSections.includes(s) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500 font-medium">Students to be added:</span>
              {loadingPreview ? (
                <Loader2 size={16} className="animate-spin text-indigo-600" />
              ) : (
                <span className="text-lg font-bold text-indigo-600">{previewCount ?? 0}</span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Duplicates will be automatically skipped.</p>
          </div>

          <button
            onClick={handleBulkAdd}
            disabled={processing || (selectedYears.length === 0 && selectedSections.length === 0)}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
          >
            {processing ? <Loader2 className="animate-spin" size={20} /> : <PlusCircle size={20} />}
            Add Selected Groups
          </button>
        </div>
      </div>
    </div>
  );
}