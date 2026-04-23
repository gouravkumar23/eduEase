"use client";

import { useState } from 'react';
import { X, Plus, Upload, Loader2, Info, ArrowRight, FileText, CheckCircle2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Setup PDF.js worker
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface KnowledgeSourceModalProps {
  availableExams: any[];
  onAddExam: (attempt: any) => Promise<void>;
  onAddFile: (title: string, content: string) => void;
  onClose: () => void;
}

export default function KnowledgeSourceModal({ availableExams, onAddExam, onAddFile, onClose }: KnowledgeSourceModalProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      let text = '';
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(' ') + '\n';
        }
      } else {
        text = await file.text();
      }

      onAddFile(file.name, text.substring(0, 15000));
      onClose();
    } catch (error) {
      alert('Failed to process file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl">
              <Plus size={20} />
            </div>
            <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Add Knowledge Source</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Upload Document</h4>
              <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-3xl cursor-pointer transition-all ${uploading ? 'bg-slate-50 border-slate-200' : 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/30'}`}>
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  {uploading ? (
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-indigo-400 mb-3" />
                      <p className="text-xs font-bold text-slate-600">Drop PDF or Text</p>
                      <p className="text-[10px] text-slate-400 mt-1">Max 10MB</p>
                    </>
                  )}
                </div>
                <input type="file" className="hidden" accept=".pdf,.txt" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Past Assessments</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {availableExams.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                    <Info size={20} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase">No released exams</p>
                  </div>
                ) : (
                  availableExams.map(attempt => (
                    <button 
                      key={attempt.id}
                      onClick={() => onAddExam(attempt)}
                      className="w-full flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-500 hover:shadow-md transition-all text-left group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{attempt.exam_title}</p>
                        <p className="text-[9px] font-bold text-indigo-600 uppercase mt-0.5">
                          {attempt.score}% Score
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            AI will analyze these sources to personalize your learning.
          </p>
        </div>
      </div>
    </div>
  );
}