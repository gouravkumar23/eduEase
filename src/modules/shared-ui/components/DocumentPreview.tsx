"use client";

import { useState, useEffect } from 'react';
import { FileText, Image as ImageIcon, Loader2, FileCode, EyeOff, Download, AlertCircle, X, Moon, Sun, ZoomIn, ZoomOut } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import * as mammoth from 'mammoth';
import PDFViewer from './PDFViewer';

interface DocumentPreviewProps {
  fileUrl: string;
  fileType: string;
  fileName?: string;
  onClose?: () => void;
  className?: string;
}

const DocumentPreview = ({ fileUrl, fileType, fileName = 'Document', onClose, className = "" }: DocumentPreviewProps) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [zoom, setZoom] = useState(1);

  const isImage = fileType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
  const isPDF = fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
  const isMarkdown = fileName.toLowerCase().endsWith('.md');
  const isText = fileType.startsWith('text/') || fileType === 'application/json' || fileName.toLowerCase().endsWith('.txt');
  const isDocx = fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.toLowerCase().endsWith('.docx');
  const isDoc = fileType === 'application/msword' || fileName.toLowerCase().endsWith('.doc');
  const isPPT = /\.(ppt|pptx)$/i.test(fileName) || fileType.includes('presentation') || fileType.includes('powerpoint');

  useEffect(() => {
    const loadContent = async () => {
      if (!fileUrl || isPPT || isPDF || isImage) return;
      setLoading(true);
      setError(null);
      
      try {
        if (isText || isMarkdown) {
          const res = await fetch(fileUrl);
          const text = await res.text();
          setTextContent(text);
        } else if (isDocx || isDoc) {
          const res = await fetch(fileUrl);
          const arrayBuffer = await res.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setHtmlContent(result.value);
        }
      } catch (err) {
        console.error("Preview error:", err);
        setError("Preview not supported for this specific file. Download to view.");
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [fileUrl, isText, isMarkdown, isDocx, isDoc, isPPT, isPDF, isImage]);

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(Math.max(0.5, prev + delta), 3));
  };

  const containerClasses = `w-full flex flex-col overflow-hidden transition-all duration-300 bg-white rounded-2xl border border-slate-200 shadow-sm ${isDarkMode ? 'dark' : ''} ${className}`;

  return (
    <div className={containerClasses} style={{ minHeight: '500px', height: '100%' }}>
      {/* Professional Toolbar */}
      <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-1.5 rounded-lg shadow-sm ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            {isImage ? <ImageIcon size={16} className="text-indigo-400" /> : 
             (isPDF || isDocx || isDoc || isPPT) ? <FileText size={16} className="text-rose-400" /> : 
             <FileCode size={16} className="text-slate-400" />}
          </div>
          <span className="text-xs font-bold truncate max-w-[150px] sm:max-w-[300px]">
            {fileName}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {isImage && (
            <div className="flex items-center gap-1 mr-2 border-r border-slate-300 dark:border-slate-700 pr-2">
              <button onClick={() => handleZoom(-0.25)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <ZoomOut size={16} />
              </button>
              <span className="text-[10px] font-bold w-8 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => handleZoom(0.25)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <ZoomIn size={16} />
              </button>
            </div>
          )}

          {(isText || isMarkdown || isDocx || isDoc) && (
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}

          <a 
            href={fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
            title="Download"
          >
            <Download size={18} />
          </a>

          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-rose-100 hover:text-rose-600 rounded-xl transition-all">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Viewer Area */}
      <div className={`flex-1 relative overflow-hidden ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-400" size={32} />
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
            <h4 className={`font-bold text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-900'}`}>{error}</h4>
          </div>
        ) : isImage ? (
          <div className="absolute inset-0 overflow-auto p-4 flex items-center justify-center">
            <img 
              src={fileUrl} 
              alt={fileName} 
              className="max-w-none transition-transform duration-200 shadow-lg rounded-lg"
              style={{ transform: `scale(${zoom})` }}
            />
          </div>
        ) : isPDF ? (
          <div className="absolute inset-0">
            <PDFViewer url={fileUrl} />
          </div>
        ) : isPPT ? (
          <div className="absolute inset-0">
            <iframe 
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
              className="w-full h-full border-none"
              title="PowerPoint Preview"
            />
          </div>
        ) : isDocx || isDoc ? (
          <div className={`absolute inset-0 p-6 sm:p-10 overflow-y-auto prose max-w-none ${isDarkMode ? 'prose-invert' : 'prose-slate'}`}>
            <div dangerouslySetInnerHTML={{ __html: htmlContent || '' }} />
          </div>
        ) : isMarkdown ? (
          <div className={`absolute inset-0 p-6 sm:p-10 overflow-y-auto prose max-w-none ${isDarkMode ? 'prose-invert' : 'prose-slate prose-indigo'}`}>
            <ReactMarkdown>{textContent || ''}</ReactMarkdown>
          </div>
        ) : isText ? (
          <div className={`absolute inset-0 p-6 font-mono text-sm overflow-y-auto ${isDarkMode ? 'bg-slate-900 text-indigo-300' : 'bg-slate-900 text-slate-300'}`}>
            <pre className="whitespace-pre-wrap break-all">{textContent}</pre>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <EyeOff size={32} className="text-slate-400" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Preview Unavailable</h4>
            <p className="text-xs text-slate-500 mt-1 mb-6">This file type cannot be viewed directly in the browser.</p>
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
            >
              <Download size={18} /> Download to View
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentPreview;