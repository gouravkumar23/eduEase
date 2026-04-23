"use client";

import { useState } from 'react';
import { X, Upload, FileText, Check, AlertTriangle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ParsedQuestion {
  text: string;
  question_type: 'mcq' | 'descriptive';
  difficulty: 'easy' | 'medium' | 'hard';
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_option?: string;
  errors: string[];
}

interface BulkUploadModalProps {
  onClose: () => void;
  onUpload: (questions: ParsedQuestion[]) => Promise<void>;
  isUploading: boolean;
  maxQuestions?: number;
}

const BulkUploadModal = ({ onClose, onUpload, isUploading, maxQuestions = 200 }: BulkUploadModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedUpload, setHasAttemptedUpload] = useState(false);

  const validateQuestion = (q: Partial<ParsedQuestion>): string[] => {
    const errors: string[] = [];
    if (!q.text?.trim()) errors.push('Question text is required');
    
    if (q.question_type === 'mcq') {
      if (q.option_a === undefined || q.option_a === '') errors.push('Option A is required');
      if (q.option_b === undefined || q.option_b === '') errors.push('Option B is required');
      if (q.option_c === undefined || q.option_c === '') errors.push('Option C is required');
      if (q.option_d === undefined || q.option_d === '') errors.push('Option D is required');
      if (!['A', 'B', 'C', 'D'].includes(q.correct_option || '')) {
        errors.push('Correct option must be A, B, C, or D');
      }
    }

    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(q.difficulty || '')) {
      errors.push('Difficulty must be easy, medium, or hard');
    }

    return errors;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);
    setHasAttemptedUpload(false);

    try {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);

          if (data.length > maxQuestions) {
            setError(`File contains ${data.length} questions. Maximum allowed is ${maxQuestions}.`);
            setSelectedFile(null);
            return;
          }

          const mappedData: ParsedQuestion[] = data.map((row: any) => {
            const getValue = (val: any) => (val !== undefined && val !== null ? String(val).trim() : '');

            const q: Partial<ParsedQuestion> = {
              text: getValue(row.question_text || row.text),
              question_type: getValue(row.type || row.question_type).toLowerCase() === 'mcq' ? 'mcq' : 'descriptive',
              difficulty: (getValue(row.difficulty) || 'medium').toLowerCase() as any,
              option_a: getValue(row.option1 || row.option_a),
              option_b: getValue(row.option2 || row.option_b),
              option_c: getValue(row.option3 || row.option_c),
              option_d: getValue(row.option4 || row.option_d),
              correct_option: getValue(row.correct_option).toUpperCase(),
            };
            return { ...q, errors: validateQuestion(q) } as ParsedQuestion;
          });

          setParsedData(mappedData);
        } catch (err) {
          setError('Failed to parse file.');
          setSelectedFile(null);
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      setError('Error reading file');
    }
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        question_text: "What is the capital of France?",
        type: "mcq",
        difficulty: "easy",
        option1: "London",
        option2: "Berlin",
        option3: "Paris",
        option4: "Madrid",
        correct_option: "C"
      },
      {
        question_text: "Explain the process of photosynthesis.",
        type: "descriptive",
        difficulty: "medium",
        option1: "",
        option2: "",
        option3: "",
        option4: "",
        correct_option: ""
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "question_upload_template.xlsx");
  };

  const handleConfirmUpload = async () => {
    if (parsedData.length > 0 && !isUploading && !hasAttemptedUpload) {
      setHasAttemptedUpload(true);
      try {
        await onUpload(parsedData);
      } catch (err) {
        setHasAttemptedUpload(false);
        setError('Upload failed.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Upload size={20} />
            <h3 className="font-bold">Bulk Upload Questions</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="mb-6 flex justify-between items-center bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <div>
              <p className="text-sm font-bold text-indigo-900">Need a template?</p>
              <p className="text-xs text-indigo-700">Download our sample file to ensure correct formatting.</p>
            </div>
            <button 
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold border border-indigo-200 hover:bg-indigo-100 transition-colors"
            >
              <Download size={14} /> Download Template
            </button>
          </div>

          {!selectedFile ? (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition-all">
              <Upload className="w-12 h-12 text-slate-400 mb-3" />
              <p className="text-sm text-slate-500">Click to upload or drag and drop</p>
              <input type="file" className="hidden" accept=".csv, .xls, .xlsx" onChange={handleFileChange} />
            </label>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <FileText className="text-indigo-600" size={24} />
                  <div>
                    <p className="text-sm font-bold">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500">{parsedData.length} questions found</p>
                  </div>
                </div>
                <button onClick={() => setSelectedFile(null)} className="text-xs font-bold text-rose-600">Change</button>
              </div>
              
              <div className="max-h-64 overflow-auto border rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="p-2">Status</th>
                      <th className="p-2">Question</th>
                      <th className="p-2">Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((q, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{q.errors.length > 0 ? <AlertTriangle size={14} className="text-rose-500" /> : <Check size={14} className="text-emerald-500" />}</td>
                        <td className="p-2 truncate max-w-[200px]">{q.text}</td>
                        <td className="p-2 text-rose-600">{q.errors[0]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {error && <div className="mt-4 p-3 bg-rose-50 text-rose-600 rounded-lg text-sm">{error}</div>}
        </div>

        <div className="p-6 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border rounded-xl font-bold">Cancel</button>
          <button 
            onClick={handleConfirmUpload} 
            disabled={!selectedFile || parsedData.some(q => q.errors.length > 0) || isUploading}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Confirm & Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;