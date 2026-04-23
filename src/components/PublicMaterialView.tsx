"use client";

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FileText, ArrowLeft, BookOpen, User, Share2, Check, ShieldCheck, Download } from 'lucide-react';
import DocumentPreview from './DocumentPreview';

interface MaterialData {
  title: string;
  subject: string;
  fileURL: string;
  fileName: string;
  fileType?: string;
  facultyName: string;
  timestamp: any;
}

export default function PublicMaterialView() {
  const { materialId } = useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<MaterialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchMaterial = async () => {
      if (!materialId) return;
      try {
        const docSnap = await getDoc(doc(db, 'materials', materialId));
        if (docSnap.exists()) {
          setMaterial(docSnap.data() as MaterialData);
        }
      } catch (error) {
        console.error("Error fetching material:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterial();
  }, [materialId]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
          <FileText size={40} className="text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Material Not Found</h1>
        <p className="text-slate-500 mt-2">The study resource you are looking for does not exist or has been removed.</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-8 flex items-center gap-2 text-indigo-600 font-bold hover:underline"
        >
          <ArrowLeft size={20} /> Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-slate-100 flex flex-col overflow-hidden">
      {/* Fixed Top Header */}
      <header className="bg-white/80 backdrop-blur-md px-4 py-3 border-b border-slate-200 flex items-center justify-between z-[60] shadow-sm shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-all shrink-0"
            title="Go Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-slate-900 truncate leading-tight">{material.title}</h1>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1"><BookOpen size={10} /> {material.subject}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span className="flex items-center gap-1"><User size={10} /> {material.facultyName}</span>
            </div>
          </div>
        </div>
        <div className="hidden sm:block">
          <ShieldCheck size={20} className="text-indigo-600" />
        </div>
      </header>

      {/* Main Content Area - No outer scroll, let the previewer handle it */}
      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 p-4 sm:p-8 flex flex-col">
          <div className="flex-1 max-w-5xl w-full mx-auto">
            <DocumentPreview 
              fileUrl={material.fileURL}
              fileName={material.fileName}
              fileType={material.fileType || 'application/octet-stream'}
              className="h-full"
            />
          </div>
        </div>
      </main>

      {/* Floating Control Bar - Bottom Center */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col sm:flex-row items-center gap-3 bg-black/70 backdrop-blur-xl p-2.5 px-6 rounded-[16px] shadow-2xl border border-white/10 w-[calc(100%-48px)] sm:w-auto animate-in slide-in-from-bottom-8 duration-500">
        <a 
          href={material.fileURL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto flex items-center justify-center gap-2 text-white hover:text-indigo-300 transition-colors font-black text-xs py-2.5 px-4"
        >
          <Download size={18} />
          <span>DOWNLOAD FILE</span>
        </a>
        
        <div className="hidden sm:block w-px h-4 bg-white/20" />
        
        <button 
          onClick={handleShare}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 font-black text-xs py-2.5 px-4 rounded-xl transition-all ${
            copied ? 'bg-emerald-50 text-white' : 'text-white hover:text-indigo-300'
          }`}
        >
          {copied ? <Check size={18} /> : <Share2 size={18} />}
          <span>{copied ? 'LINK COPIED' : 'SHARE MATERIAL'}</span>
        </button>
      </div>

      {/* Minimal Branding Overlay */}
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none hidden sm:block">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">
          EduEase Integrity Engine
        </p>
      </div>
    </div>
  );
}