"use client";

import React, { useState } from 'react';
import { X, Upload, FileText, Check, AlertTriangle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportDialogProps {
  onClose: () => void;
  onImport: (nodes: any[]) => void;
}

export default function ImportDialog({ onClose, onImport }: ImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          if (file.name.endsWith('.json')) {
            const json = JSON.parse(bstr as string);
            if (Array.isArray(json)) {
              setParsedData(json);
            } else {
              setParsedData([json]);
            }
          } else {
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            setParsedData(data);
          }
        } catch (err) {
          setError('Failed to parse file. Ensure valid JSON or CSV/Excel format.');
          setSelectedFile(null);
        }
      };
      if (file.name.endsWith('.json')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    } catch (err) {
      setError('Error reading file');
    }
  };

  const handleConfirm = () => {
    if (parsedData.length > 0) {
      onImport(parsedData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-3xl border border-slate-800 max-w-md w-full overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h3 className="font-bold text-white text-lg">Import Learning Graph</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          {!selectedFile ? (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-800 rounded-2xl cursor-pointer hover:border-indigo-500 hover:bg-slate-950/30 transition-all">
              <Upload className="w-12 h-12 text-slate-500 mb-3" />
              <p className="text-sm text-slate-400">Click to upload CSV or JSON</p>
              <input type="file" className="hidden" accept=".csv, .json, .xlsx" onChange={handleFileChange} />
            </label>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <FileText className="text-indigo-400" size={24} />
                  <div>
                    <p className="text-sm font-bold text-white">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500">{parsedData.length} nodes detected</p>
                  </div>
                </div>
                <button onClick={() => setSelectedFile(null)} className="text-xs font-bold text-rose-400">Change</button>
              </div>
            </div>
          )}
          {error && <div className="p-3 bg-rose-950/50 text-rose-400 rounded-xl text-xs font-bold border border-rose-900">{error}</div>}
        </div>

        <div className="p-6 border-t border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-800 rounded-xl font-bold text-sm text-slate-400 hover:bg-slate-800">Cancel</button>
          <button 
            onClick={handleConfirm} 
            disabled={!selectedFile || parsedData.length === 0}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            Confirm & Import
          </button>
        </div>
      </div>
    </div>
  );
}