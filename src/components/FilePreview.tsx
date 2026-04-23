"use client";

import { useState, useEffect } from 'react';
import { FileText, Image as ImageIcon, Loader2, Maximize2, X, Download, Share2, FileCode } from 'lucide-react';

interface FilePreviewProps {
  fileUrl: string;
  fileName: string;
  fileType: string;
  onDownload?: () => void;
  onShare?: () => void;
}

const FilePreview = ({ fileUrl, fileName, fileType, onDownload, onShare }: FilePreviewProps) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);

  const isImage = fileType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
  const isPDF = fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
  const isText = fileType.startsWith('text/') || /\.(txt|md|json|js|ts|tsx|html|css)$/i.test(fileName);

  useEffect(() => {
    if (isText && fileUrl) {
      fetchTextContent();
    }
  }, [fileUrl, isText]);

  const fetchTextContent = async () => {
    setLoading(true);
    try {
      const res = await fetch(fileUrl);
      const text = await res.text();
      setTextContent(text);
    } catch (err) {
      setTextContent("Unable to load text content preview.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 px-2">
          <div className="p-1.5 bg-white rounded-lg shadow-sm">
            {isImage ? <ImageIcon size={16} className="text-indigo-600" /> : 
             isPDF ? <FileText size={16} className="text-rose-600" /> : 
             <FileCode size={16} className="text-slate-600" />}
          </div>
          <span className="text-xs font-bold text-slate-700 truncate max-w-[150px] sm:max-w-[300px]">
            {fileName}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onDownload && (
            <button 
              onClick={onDownload}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"
              title="Download"
            >
              <Download size={18} />
            </button>
          )}
          {onShare && (
            <button 
              onClick={onShare}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"
              title="Share"
            >
              <Share2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm min-h-[300px] flex flex-col">
        {isImage ? (
          <div className="relative group flex-1 flex items-center justify-center p-4 bg-slate-50">
            <img 
              src={fileUrl} 
              alt={fileName} 
              className="max-w-full max-h-[500px] rounded-xl shadow-lg object-contain cursor-pointer transition-transform hover:scale-[1.01]"
              onClick={() => setShowFullScreen(true)}
            />
            <button 
              onClick={() => setShowFullScreen(true)}
              className="absolute top-6 right-6 p-3 bg-black/50 text-white rounded-2xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Maximize2 size={20} />
            </button>
          </div>
        ) : isPDF ? (
          <div className="flex-1 h-[600px]">
            <iframe 
              src={`${fileUrl}#toolbar=0`}
              className="w-full h-full border-none"
              title="PDF Preview"
            />
          </div>
        ) : isText ? (
          <div className="flex-1 p-6 bg-slate-900 text-slate-300 font-mono text-sm overflow-auto max-h-[600px]">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-400" />
              </div>
            ) : (
              <pre className="whitespace-pre-wrap break-all">{textContent}</pre>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4">
              <FileText size={40} className="text-slate-300" />
            </div>
            <h4 className="font-bold text-slate-900">No Preview Available</h4>
            <p className="text-sm text-slate-500 mt-1 mb-6">This file type cannot be previewed inline.</p>
            <button 
              onClick={onDownload}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
            >
              <Download size={18} /> Download to View
            </button>
          </div>
        )}
      </div>

      {/* Full Screen Image Modal */}
      {showFullScreen && isImage && (
        <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <button 
            onClick={() => setShowFullScreen(false)}
            className="absolute top-6 right-6 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"
          >
            <X size={24} />
          </button>
          <img 
            src={fileUrl} 
            alt={fileName} 
            className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-300"
          />
        </div>
      )}
    </div>
  );
};

export default FilePreview;