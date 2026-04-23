"use client";

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { 
  Trophy, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Share2, 
  Check, 
  Medal, 
  ArrowLeft,
  BookOpen,
  Users,
  Lock,
  LayoutGrid
} from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  student_name: string;
  score: number;
  obtained_score: number;
  total_exam_score: number;
  submitted_at: any;
}

export default function PublicLeaderboard() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [copied, setCopied] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      if (!examId) return;
      try {
        // Fetch Exam Details
        const examDoc = await getDoc(doc(db, 'exams', examId));
        if (examDoc.exists()) {
          setExam({ id: examDoc.id, ...examDoc.data() });
        }

        // Fetch Attempts
        const q = query(
          collection(db, 'attempts'),
          where('exam_id', '==', examId),
          where('status', 'in', ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED']),
          orderBy('score', 'desc')
        );
        
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as LeaderboardEntry[];
        
        setEntries(data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [examId]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredEntries = entries.filter(e => 
    e.student_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <Trophy size={64} className="text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900">Leaderboard Not Found</h1>
        <button onClick={() => navigate('/leaderboards')} className="mt-6 text-indigo-600 font-bold flex items-center gap-2">
          <ArrowLeft size={20} /> Back to All Leaderboards
        </button>
      </div>
    );
  }

  const resultsReleased = exam.results_released === true;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => navigate('/leaderboards')}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm transition-colors"
          >
            <LayoutGrid size={18} />
            View All Leaderboards
          </button>
        </div>

        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-8">
          <div className="bg-indigo-600 p-6 sm:p-10 text-white relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                    <Trophy size={24} className="text-amber-300" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest opacity-80">Official Leaderboard</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black mb-2">{exam.title}</h1>
                <div className="flex flex-wrap gap-4 text-sm text-indigo-100">
                  <span className="flex items-center gap-1.5"><BookOpen size={16} /> {exam.subject}</span>
                  <span className="flex items-center gap-1.5"><Users size={16} /> {entries.length} Participants</span>
                </div>
              </div>
              <button 
                onClick={handleShare}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg ${
                  copied ? 'bg-emerald-50 text-white' : 'bg-white text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                {copied ? <Check size={18} /> : <Share2 size={18} />}
                {copied ? 'Link Copied' : 'Share Leaderboard'}
              </button>
            </div>
          </div>

          {/* Search & Stats */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Search student name..." 
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rank</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedEntries.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">
                      No results found matching your search.
                    </td>
                  </tr>
                ) : (
                  paginatedEntries.map((entry, index) => {
                    const rank = (currentPage - 1) * itemsPerPage + index + 1;
                    const isTop3 = rank <= 3;
                    
                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            {rank === 1 ? (
                              <Medal size={24} className="text-amber-400" />
                            ) : rank === 2 ? (
                              <Medal size={24} className="text-slate-400" />
                            ) : rank === 3 ? (
                              <Medal size={24} className="text-amber-600" />
                            ) : (
                              <span className="w-6 text-center font-bold text-slate-400 text-sm">{rank}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                              isTop3 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {entry.student_name[0]}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                {entry.student_name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                Verified Submission
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          {resultsReleased ? (
                            <div className="inline-flex flex-col items-end">
                              <span className={`text-lg font-black ${isTop3 ? 'text-indigo-600' : 'text-slate-700'}`}>
                                {entry.score}%
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                {entry.obtained_score} / {entry.total_exam_score}
                              </span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                              <Lock size={12} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Pending</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50 transition-all shadow-sm"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50 transition-all shadow-sm"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Powered by EduEase Integrity Engine
          </p>
        </div>
      </div>
    </div>
  );
}