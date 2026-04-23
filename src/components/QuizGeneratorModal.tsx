"use client";

import { useState } from 'react';
import { Sparkles, Loader2, X, CheckCircle2, AlertCircle, BrainCircuit } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { runWithAIFallback } from '../utils/ai';
import * as pdfjsLib from 'pdfjs-dist';

// Import the worker locally using Vite's ?url suffix
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

// Set up PDF.js worker using the local bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface QuizGeneratorModalProps {
  material: {
    id: string;
    title: string;
    subject: string;
    fileURL: string;
    fileName: string;
  };
  onClose: () => void;
}

export default function QuizGeneratorModal({ material, onClose }: QuizGeneratorModalProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'extracting' | 'generating' | 'saving' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  
  // Dynamic Distribution State
  const [total, setTotal] = useState(10);
  const [easy, setEasy] = useState(4);
  const [medium, setMedium] = useState(4);
  const [hard, setHard] = useState(2);

  const handleTotalChange = (val: number) => {
    const t = Math.max(1, val);
    setTotal(t);
    const e = Math.floor(t * 0.4);
    const m = Math.floor(t * 0.4);
    const h = t - e - m;
    setEasy(e);
    setMedium(m);
    setHard(h);
  };

  const handleEasyChange = (val: number) => {
    const e = Math.min(total, Math.max(0, val));
    setEasy(e);
    const remaining = total - e;
    const m = Math.floor(remaining * 0.6);
    const h = remaining - m;
    setMedium(m);
    setHard(h);
  };

  const handleMediumChange = (val: number) => {
    const m = Math.min(total, Math.max(0, val));
    setMedium(m);
    const remaining = total - m;
    const e = Math.floor(remaining * 0.6);
    const h = remaining - e;
    setEasy(e);
    setHard(h);
  };

  const handleHardChange = (val: number) => {
    const h = Math.min(total, Math.max(0, val));
    setHard(h);
    const remaining = total - h;
    const e = Math.floor(remaining * 0.5);
    const m = remaining - e;
    setEasy(e);
    setMedium(m);
  };

  const isInvalid = (easy + medium + hard) !== total;

  const extractText = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
      const blob = await response.blob();
      
      if (material.fileName.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await blob.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        const pagesToRead = Math.min(pdf.numPages, 10);
        for (let i = 1; i <= pagesToRead; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }
        return fullText;
      } else {
        return await blob.text();
      }
    } catch (err) {
      console.error('Extraction error:', err);
      throw new Error('Failed to extract text from the file.');
    }
  };

  const handleGenerate = async () => {
    if (!user || isInvalid) return;
    setStatus('extracting');
    setError('');

    try {
      const text = await extractText(material.fileURL);
      
      if (text.trim().length < 100) {
        throw new Error('The document contains too little text to generate a quality quiz.');
      }

      setStatus('generating');

      const generatedQuestions = await runWithAIFallback(async (model) => {
        const prompt = `
          You are an expert educator. Based on the provided text, generate exactly ${total} high-quality multiple-choice questions.
          
          REQUIRED DIFFICULTY DISTRIBUTION:
          - Easy: ${easy} questions
          - Medium: ${medium} questions
          - Hard: ${hard} questions
          
          TOTAL QUESTIONS TO GENERATE: ${total}

          RULES:
          1. Return ONLY a valid JSON array of objects.
          2. Each object must have:
             - "text": The question text
             - "option_a": First option
             - "option_b": Second option
             - "option_c": Third option
             - "option_d": Fourth option
             - "correct_option": Exactly "A", "B", "C", or "D"
             - "difficulty": Exactly "easy", "medium", or "hard"
          3. You MUST generate exactly the number of questions specified for each difficulty level.
          4. The total number of items in the JSON array MUST be exactly ${total}.
          5. Ensure questions are diverse and cover key concepts from the text.
          6. Do not include any markdown formatting, preamble, or explanations outside the JSON array.

          TEXT CONTENT:
          ${text.substring(0, 15000)} 
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonText = response.text().replace(/```json|```/g, '').trim();
        return JSON.parse(jsonText);
      });

      setStatus('saving');
      
      const examRef = await addDoc(collection(db, 'exams'), {
        title: `AI Quiz: ${material.title}`,
        subject: material.subject,
        duration: 30,
        exam_mode: 'quiz',
        source: 'AI',
        faculty_id: user.id,
        faculty_name: user.name,
        status: 'draft',
        is_published: false,
        is_active: false,
        created_at: serverTimestamp(),
        source_material_id: material.id,
        questions_per_student: total,
        easy_count: easy,
        medium_count: medium,
        hard_count: hard,
        score_easy: 1,
        score_medium: 2,
        score_hard: 3
      });

      const questionsCollection = collection(db, 'questions');
      for (const q of generatedQuestions) {
        await addDoc(questionsCollection, {
          exam_id: examRef.id,
          text: q.text,
          question_type: 'mcq',
          difficulty: q.difficulty,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: q.correct_option,
          created_at: serverTimestamp()
        });
      }

      setStatus('success');
    } catch (err: any) {
      console.error('[AI_GEN_ERROR]', err);
      setError(err.message || 'An unexpected error occurred during generation.');
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-md w-full overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <BrainCircuit size={20} />
            </div>
            <h3 className="font-bold text-slate-900">AI Quiz Generator</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="p-8 text-center">
          {status === 'idle' && (
            <>
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles size={32} className="animate-pulse" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Configure AI Quiz</h4>
              <p className="text-sm text-slate-500 mb-8">
                Set the question count and difficulty distribution.
              </p>
              
              <div className="space-y-6 mb-8 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Total Questions</label>
                  <input 
                    type="number" 
                    value={total}
                    onChange={(e) => handleTotalChange(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                    min={1}
                    max={50}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1.5">Easy</label>
                    <input 
                      type="number" 
                      value={easy}
                      onChange={(e) => handleEasyChange(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold text-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-600 uppercase mb-1.5">Medium</label>
                    <input 
                      type="number" 
                      value={medium}
                      onChange={(e) => handleMediumChange(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm font-bold text-amber-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-rose-600 uppercase mb-1.5">Hard</label>
                    <input 
                      type="number" 
                      value={hard}
                      onChange={(e) => handleHardChange(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-rose-50 border border-rose-100 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm font-bold text-rose-700"
                    />
                  </div>
                </div>

                {isInvalid && (
                  <div className="flex items-center gap-2 text-rose-600 text-[10px] font-bold bg-rose-50 p-2 rounded-lg border border-rose-100">
                    <AlertCircle size={14} />
                    Sum ({easy + medium + hard}) must equal Total ({total})
                  </div>
                )}
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isInvalid}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles size={18} />
                Generate Draft Quiz
              </button>
            </>
          )}

          {(status === 'extracting' || status === 'generating' || status === 'saving') && (
            <div className="py-8">
              <Loader2 size={48} className="text-indigo-600 animate-spin mx-auto mb-6" />
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                {status === 'extracting' && 'Analyzing Content...'}
                {status === 'generating' && 'Gemini is Generating...'}
                {status === 'saving' && 'Saving AI Draft...'}
              </h4>
              <p className="text-sm text-slate-500">Creating your custom assessment.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={32} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Draft Created!</h4>
              <p className="text-sm text-slate-500 mb-8">
                The AI-generated quiz is now available in your dashboard drafts for manual review and editing.
              </p>
              <button 
                onClick={onClose}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
              >
                Done
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="py-4">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Generation Failed</h4>
              <p className="text-sm text-rose-600 mb-8">{error}</p>
              <button 
                onClick={() => setStatus('idle')}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}