"use client";

import React from 'react';
import { X, Download, FileJson, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExportDialogProps {
  onClose: () => void;
  nodes: any[];
  roadmapTitle: string;
}

export default function ExportDialog({ onClose, nodes, roadmapTitle }: ExportDialogProps) {
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(nodes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${roadmapTitle.replace(/\s+/g, '_')}_roadmap.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onClose();
  };

  const handleExportCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(nodes.map(n => ({
      ID: n.id,
      ParentID: n.parentId,
      Type: n.nodeType,
      Title: n.title,
      Description: n.description,
      Order: n.order,
      Depth: n.depth,
      EstimatedHours: n.estimatedHours,
      EstimatedQuestions: n.estimatedQuestions,
      Difficulty: n.difficulty,
      Status: n.status
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Roadmap Nodes");
    XLSX.writeFile(workbook, `${roadmapTitle.replace(/\s+/g, '_')}_roadmap.xlsx`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-3xl border border-slate-800 max-w-md w-full overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h3 className="font-bold text-white text-lg">Export Learning Graph</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-4">
          <button 
            onClick={handleExportJSON}
            className="flex flex-col items-center justify-center p-6 bg-slate-950 border border-slate-800 rounded-2xl hover:border-indigo-500 hover:bg-slate-950/50 transition-all text-center group"
          >
            <FileJson size={32} className="text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold text-white">Export JSON</span>
            <span className="text-[10px] text-slate-500 mt-1">Preserves full hierarchy</span>
          </button>

          <button 
            onClick={handleExportCSV}
            className="flex flex-col items-center justify-center p-6 bg-slate-950 border border-slate-800 rounded-2xl hover:border-indigo-500 hover:bg-slate-950/50 transition-all text-center group"
          >
            <FileSpreadsheet size={32} className="text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold text-white">Export Excel/CSV</span>
            <span className="text-[10px] text-slate-500 mt-1">Tabular format</span>
          </button>
        </div>
      </div>
    </div>
  );
}