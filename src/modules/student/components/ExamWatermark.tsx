"use client";

import { useState, useEffect } from 'react';

interface ExamWatermarkProps {
  studentName: string;
  studentId: string;
  examTitle: string;
  expiresAt?: any;
}

export const ExamWatermark = ({ studentName, studentId, examTitle, expiresAt }: ExamWatermarkProps) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const end = expiresAt.toDate ? expiresAt.toDate().getTime() : new Date(expiresAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      setTimeLeft(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // High-frequency repeating text for OCR/LLM detection
  const watermarkText = `${studentName} (${studentId.substring(0, 6)}) | ${examTitle} | EDUEASE | REMAINING: ${timeLeft}`;

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden select-none opacity-[0.12]">
      <div className="absolute inset-0 flex flex-wrap gap-x-24 gap-y-32 p-10 justify-center items-center">
        {Array.from({ length: 40 }).map((_, i) => (
          <div 
            key={i} 
            className="text-slate-900 font-black text-[10px] sm:text-xs whitespace-nowrap transform -rotate-[25deg] shrink-0 tracking-tighter"
          >
            {watermarkText}
          </div>
        ))}
      </div>
    </div>
  );
};