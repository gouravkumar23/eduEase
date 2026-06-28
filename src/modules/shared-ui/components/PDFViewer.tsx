"use client";

import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, AlertCircle } from 'lucide-react';

// Setup worker
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PDFViewerProps {
  url: string;
}

export default function PDFViewer({ url }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  useEffect(() => {
    const loadPDF = async () => {
      setLoading(true);
      setError(null);
      try {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdfDoc = await loadingTask.promise;
        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
        setPageNum(1);
      } catch (err: any) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF document.');
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, [url]);

  useEffect(() => {
    if (!pdf) return;

    const renderPage = async () => {
      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Cancel previous render task if it exists
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('Error rendering page:', err);
        }
      }
    };

    renderPage();
  }, [pdf, pageNum, scale]);

  const changePage = (offset: number) => {
    setPageNum(prev => Math.min(Math.max(1, prev + offset), numPages));
  };

  const changeZoom = (delta: number) => {
    setScale(prev => Math.min(Math.max(0.5, prev + delta), 3.0));
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading PDF document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h4 className="font-bold text-slate-900">{error}</h4>
        <p className="text-sm text-slate-500 mt-1">Please try downloading the file instead.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-100">
      {/* PDF Toolbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => changePage(-1)} 
            disabled={pageNum <= 1}
            className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-xs font-bold text-slate-600 min-w-[80px] text-center">
            Page {pageNum} of {numPages}
          </span>
          <button 
            onClick={() => changePage(1)} 
            disabled={pageNum >= numPages}
            className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => changeZoom(-0.25)} 
            disabled={scale <= 0.5}
            className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors"
          >
            <ZoomOut size={20} />
          </button>
          <span className="text-xs font-bold text-slate-600 min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button 
            onClick={() => changeZoom(0.25)} 
            disabled={scale >= 3.0}
            className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors"
          >
            <ZoomIn size={20} />
          </button>
        </div>
      </div>

      {/* PDF Canvas Container */}
      <div className="flex-1 overflow-auto p-4 flex justify-center items-start">
        <div className="bg-white shadow-2xl rounded-sm overflow-hidden">
          <canvas ref={canvasRef} className="max-w-full h-auto" />
        </div>
      </div>
    </div>
  );
}