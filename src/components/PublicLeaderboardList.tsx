"use client";

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Trophy, Search, BookOpen, Users, ArrowRight, Calendar, ShieldCheck, LayoutGrid } from 'lucide-react';

interface ExamSummary {
  id: string;
  title: string;
  subject: string;
  faculty_name: string;
  status: string;
  results_released: boolean;
  created_at: any;
}

export default function PublicLeaderboardList() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const q = query(
          collection(db, 'exams'),
          where('status', 'in', ['approved', 'completed']),
          orderBy('created_at', 'desc')
        );
        const snap = await getDocs(q);
        setExams(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ExamSummary[]);
      } catch (error) {
        console.error("Error fetching exams:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const filteredExams = exams.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-[24px] shadow-xl shadow-indigo-100 mb-6">
            <Trophy className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">Assessment Leaderboards</h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            Browse and view performance rankings for all examinations conducted on the EduEase platform.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="mb-10 relative max-w-2xl mx-auto">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by exam title or subject..." 
            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[20px] shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredExams.length === 0 ? (
          <div className="bg-white rounded-[32px] border border-dashed border-slate-300 p-20 text-center">
            <LayoutGrid className="mx-auto text-slate-200 mb-4" size={64} />
            <h3 className="text-xl font-bold text-slate-900">No leaderboards found</h3>
            <p className="text-slate-500">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredExams.map((exam) => (
              <button 
                key={exam.id}
                onClick={() => navigate(`/leaderboard/${exam.id}`)}
                className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all text-left group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${
                      exam.results_released ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {exam.results_released ? 'Results Released' : 'Results Pending'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Calendar size={12} />
                      {exam.created_at?.toDate().toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {exam.title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500 font-medium mb-6">
                    <span className="flex items-center gap-1.5"><BookOpen size={14} className="text-indigo-400" /> {exam.subject}</span>
                    <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-indigo-400" /> {exam.faculty_name}</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
                      View Rankings
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            EduEase Integrity Engine • Public Directory
          </p>
        </div>
      </div>
    </div>
  );
}