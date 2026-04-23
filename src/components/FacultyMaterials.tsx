"use client";

import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Trash2, Download, Plus, Search, BookOpen, Calendar, Sparkles, Share2, Check } from 'lucide-react';
import MaterialUpload from './MaterialUpload';
import QuizGeneratorModal from './QuizGeneratorModal';

interface Material {
  id: string;
  title: string;
  subject: string;
  fileURL: string;
  fileName: string;
  timestamp: any;
}

export default function FacultyMaterials() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [generatingMaterial, setGeneratingMaterial] = useState<Material | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'materials'),
      where('uploadedBy', '==', user.id),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMaterials(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Material[]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;
    try {
      await deleteDoc(doc(db, 'materials', id));
    } catch (error) {
      alert('Failed to delete material');
    }
  };

  const handleShare = (id: string) => {
    const shareUrl = `${window.location.origin}/#/material/${id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredMaterials = materials.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="py-12 text-center text-slate-500">Loading materials...</div>;

  return (
    <div className="space-y-6">
      {generatingMaterial && (
        <QuizGeneratorModal 
          material={generatingMaterial} 
          onClose={() => setGeneratingMaterial(null)} 
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Study Materials</h2>
          <p className="text-slate-500 text-sm">Upload and manage resources for your students.</p>
        </div>
        <button 
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-100"
        >
          <Plus size={18} />
          Upload New Material
        </button>
      </div>

      {showUpload && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <MaterialUpload 
            onSuccess={() => setShowUpload(false)} 
            onCancel={() => setShowUpload(false)} 
          />
        </div>
      )}

      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by title or subject..." 
          className="flex-1 outline-none text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <BookOpen className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-900">No materials found</h3>
          <p className="text-slate-500">Start by uploading your first study resource.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMaterials.map((material) => (
            <div key={material.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{material.title}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <BookOpen size={12} /> {material.subject}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleShare(material.id)}
                    className={`p-2 rounded-lg transition-all ${copiedId === material.id ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                    title="Share Material"
                  >
                    {copiedId === material.id ? <Check size={18} /> : <Share2 size={18} />}
                  </button>
                  <button 
                    onClick={() => setGeneratingMaterial(material)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="Generate AI Quiz"
                  >
                    <Sparkles size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(material.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <Calendar size={12} />
                  {material.timestamp?.toDate().toLocaleDateString()}
                </div>
                <a 
                  href={material.fileURL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-indigo-600 font-bold text-xs hover:underline"
                >
                  <Download size={14} />
                  Download File
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}