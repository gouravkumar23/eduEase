import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Users, Clock, Hash, Upload, Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { runWithAIFallback } from '../utils/ai';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface ExamFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
  examId?: string;
}

const BRANCHES = ['CSE', 'IT', 'MECH', 'CIVIL', 'CSD', 'CSM', 'AIML'];
const YEARS = ['1', '2', '3', '4'];
const SECTIONS = ['A', 'B', 'C', 'D'];

export default function ExamForm({ onSuccess, onCancel, initialData, examId }: ExamFormProps) {
  const formatTimestamp = (ts: any) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  };

  const [title, setTitle] = useState(initialData?.title || '');
  const [duration, setDuration] = useState(initialData?.duration?.toString() || '60');
  const [mode, setMode] = useState(initialData?.exam_mode || 'mixed');
  const [startTime, setStartTime] = useState(formatTimestamp(initialData?.start_time));
  const [endTime, setEndTime] = useState(formatTimestamp(initialData?.end_time));
  
  const [targetType, setTargetType] = useState<'section' | 'room'>(initialData?.target_type || 'section');
  const [targetRoomId, setTargetRoomId] = useState(initialData?.target_room_id || '');
  const [targetBranch, setTargetBranch] = useState(initialData?.target_branch || 'ALL');
  const [targetYear, setTargetYear] = useState(initialData?.target_year || 'ALL');
  const [targetSection, setTargetSection] = useState(initialData?.target_section || 'ALL');

  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');

  const [rooms, setRooms] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchRooms = async () => {
      if (!user) return;
      const q = query(
        collection(db, 'rooms'), 
        where('faculty_id', '==', user.id),
        where('status', '==', 'approved')
      );
      const snap = await getDocs(q);
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchRooms();
  }, [user]);

  const extractText = async (file: File): Promise<string> => {
    if (file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      const pagesToRead = Math.min(pdf.numPages, 10);
      for (let i = 1; i <= pagesToRead; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
      }
      return fullText;
    } else {
      return await file.text();
    }
  };

  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Cloudinary upload failed');
    return await res.json();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const dur = parseInt(duration);

    if (dur <= 0) {
      setError('Duration must be greater than 0');
      return;
    }

    if (start >= end) {
      setError('End time must be after start time');
      return;
    }

    if (targetType === 'room' && !targetRoomId) {
      setError('Please select a target room');
      return;
    }

    setLoading(true);

    try {
      let materialId = initialData?.source_material_id || '';
      let generatedQuestions: any[] = [];

      if (materialFile && !examId) {
        setIsGenerating(true);
        
        setGenerationStatus('Uploading material...');
        const cloudData = await uploadToCloudinary(materialFile);
        
        setGenerationStatus('Extracting content...');
        const text = await extractText(materialFile);

        setGenerationStatus('AI is generating questions...');
        
        generatedQuestions = await runWithAIFallback(async (model) => {
          const prompt = `Generate 10 high-quality MCQs from this text. Return ONLY a JSON array of objects with: text, option_a, option_b, option_c, option_d, correct_option (A/B/C/D), difficulty (easy/medium/hard). TEXT: ${text.substring(0, 10000)}`;
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const jsonText = response.text().replace(/```json|```/g, '').trim();
          return JSON.parse(jsonText);
        });

        const matRef = await addDoc(collection(db, 'materials'), {
          title: `Exam Resource: ${title}`,
          subject: initialData?.subject || 'General',
          fileURL: cloudData.secure_url,
          fileName: materialFile.name,
          uploadedBy: user.id,
          facultyName: user.name,
          timestamp: serverTimestamp()
        });
        materialId = matRef.id;
      }

      const examData = {
        title,
        duration: dur,
        exam_mode: materialFile ? 'quiz' : mode,
        start_time: Timestamp.fromDate(start),
        end_time: Timestamp.fromDate(end),
        target_type: targetType,
        source_material_id: materialId,
        ...(targetType === 'room' ? {
          target_room_id: targetRoomId,
          target_branch: 'N/A',
          target_year: 'ALL',
          target_section: 'ALL'
        } : {
          target_room_id: '',
          target_branch: targetBranch,
          target_year: targetYear,
          target_section: targetSection
        }),
        updated_at: serverTimestamp(),
      };

      let finalExamId = examId;

      if (examId) {
        await updateDoc(doc(db, 'exams', examId), examData);
      } else {
        const examRef = await addDoc(collection(db, 'exams'), {
          ...examData,
          faculty_id: user.id,
          faculty_name: user.name,
          is_published: false,
          is_active: false,
          status: 'draft',
          created_at: serverTimestamp(),
          source: materialFile ? 'AI' : 'MANUAL'
        });
        finalExamId = examRef.id;

        if (generatedQuestions.length > 0) {
          const qCol = collection(db, 'questions');
          for (const q of generatedQuestions) {
            await addDoc(qCol, {
              ...q,
              exam_id: finalExamId,
              question_type: 'mcq',
              created_at: serverTimestamp()
            });
          }
        }
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">{examId ? 'Edit Assessment Details' : 'Create New Examination'}</h3>
        <button onClick={onCancel} className="text-indigo-100 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl mb-6 text-sm font-medium flex items-center gap-2">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Exam Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                  placeholder="e.g. Mid-term Assessment" 
                  required 
                />
              </div>

              {!examId && (
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="text-indigo-600" size={18} />
                    <span className="text-sm font-bold text-indigo-900">AI Question Generation (Optional)</span>
                  </div>
                  <p className="text-xs text-indigo-700 mb-4">Upload a PDF or Text file to automatically generate 10 MCQs for this exam.</p>
                  
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${materialFile ? 'border-emerald-500 bg-emerald-50' : 'border-indigo-200 hover:border-indigo-400 bg-white'}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {materialFile ? (
                        <div className="flex items-center gap-2 text-emerald-600 font-bold">
                          <CheckCircle2 size={24} />
                          <span className="text-sm truncate max-w-[200px]">{materialFile.name}</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-indigo-400 mb-2" />
                          <p className="text-xs text-indigo-500 font-medium">Click to upload study material</p>
                        </>
                      )}
                    </div>
                    <input type="file" className="hidden" accept=".pdf,.txt" onChange={(e) => setMaterialFile(e.target.files?.[0] || null)} />
                  </label>
                  {materialFile && (
                    <button type="button" onClick={() => setMaterialFile(null)} className="mt-2 text-[10px] font-bold text-rose-600 uppercase hover:underline">Remove File</button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Duration (min)</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="number" 
                      value={duration} 
                      onChange={(e) => setDuration(e.target.value)} 
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                      placeholder="e.g. 60"
                      required 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Exam Mode</label>
                  <select 
                    value={mode} 
                    onChange={(e) => setMode(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none appearance-none focus:ring-2 focus:ring-indigo-500"
                    disabled={!!materialFile}
                  >
                    <option value="mixed">Mixed (MCQ + Descriptive)</option>
                    <option value="quiz">Quiz (MCQ Only)</option>
                    <option value="descriptive">Descriptive Only</option>
                  </select>
                  {materialFile && <p className="text-[10px] text-indigo-600 font-bold mt-1">AI generation defaults to Quiz mode</p>}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Targeting Method</label>
                <div className="flex gap-4 mb-6">
                  <button 
                    type="button"
                    onClick={() => setTargetType('section')}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${targetType === 'section' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-600 border border-slate-200'}`}
                  >
                    <Users size={18} /> Year & Section
                  </button>
                  <button 
                    type="button"
                    onClick={() => setTargetType('room')}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${targetType === 'room' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-600 border border-slate-200'}`}
                  >
                    <Hash size={18} /> Exam Room
                  </button>
                </div>

                {targetType === 'section' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Branch</label>
                      <select value={targetBranch} onChange={(e) => setTargetBranch(e.target.value)} className="w-full px-3 py-2 bg-white border rounded-lg outline-none text-sm">
                        <option value="ALL">All Branches</option>
                        {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Year</label>
                      <select value={targetYear} onChange={(e) => setTargetYear(e.target.value)} className="w-full px-3 py-2 bg-white border rounded-lg outline-none text-sm">
                        <option value="ALL">All Years</option>
                        {YEARS.map(y => <option key={y} value={y}>{y} Year</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Section</label>
                      <select value={targetSection} onChange={(e) => setTargetSection(e.target.value)} className="w-full px-3 py-2 bg-white border rounded-lg outline-none text-sm">
                        <option value="ALL">All Sections</option>
                        {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="animate-in fade-in duration-200">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Select Approved Room</label>
                    <select 
                      value={targetRoomId} 
                      onChange={(e) => setTargetRoomId(e.target.value)} 
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm"
                      required={targetType === 'room'}
                    >
                      <option value="">Select a Room</option>
                      {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Start Time</label>
                  <input 
                    type="datetime-local" 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">End Time</label>
                  <input 
                    type="datetime-local" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                    required 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <button 
              type="submit" 
              disabled={loading || isGenerating} 
              className="flex-[2] bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  {generationStatus}
                </>
              ) : loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Saving Assessment...
                </>
              ) : (
                <>
                  {materialFile && <Sparkles size={20} />}
                  {examId ? 'Update Assessment' : materialFile ? 'Generate & Create Exam' : 'Create Assessment'}
                </>
              )}
            </button>
            <button 
              type="button" 
              onClick={onCancel} 
              className="flex-1 bg-slate-100 text-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}