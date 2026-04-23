"use client";

import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Search, X, BookOpen, Loader2, Plus } from 'lucide-react';

interface Material {
  id: string;
  title: string;
  subject: string;
  fileURL: string;
  fileName: string;
}

interface MaterialPickerProps {
  onSelect: (material: Material) => void;
  onClose: () => void;
}

export default function MaterialPicker({ onSelect, onClose }: MaterialPickerProps) {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMaterials = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'materials'),
          where('uploadedBy', '==', user.id),
          orderBy('timestamp', 'desc')
        );
        const snap = await getDocs(q);
        setMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Material[]);
      } catch (error) {
        console.error("Error fetching materials:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, [user]);

  const filtered = materials.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[70vh]">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <FileText size={18} className="text-indigo-600" />
            Share Material
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search materials..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="animate-spin text-indigo-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No materials found.
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onSelect(m)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-indigo-50 transition-colors text-left group"
                >
                  <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-white transition-colors">
                    <FileText size={20} className="text-slate-500 group-hover:text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{m.title}</p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <BookOpen size={10} /> {m.subject}
                    </p>
                  </div>
                  <Plus size={18} className="text-slate-300 group-hover:text-indigo-600" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}