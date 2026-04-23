import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Target, Award, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface AnalyticsProps {
  data: {
    metrics: {
      assigned_count: number;
      completed_count: number;
      average_score: number;
    };
    performanceTrend: Array<{ name: string; score: number; date: string }>;
  };
}

export default function StudentAnalytics({ data }: AnalyticsProps) {
  const { metrics, performanceTrend } = data;
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const attemptsRef = collection(db, 'attempts');
      const q = query(attemptsRef, where('student_id', '==', user.id));
      const snap = await getDocs(q);
      const history = snap.docs.map(doc => doc.data());

      const worksheet = XLSX.utils.json_to_sheet(history.map((row: any) => ({
        'Exam Name': row.exam_title || 'N/A',
        'Total Score': 100,
        'Obtained Score': row.score || 0,
        'Faculty': row.faculty_name || 'N/A',
        'Submission Timestamp': row.submitted_at?.toDate ? row.submitted_at.toDate().toLocaleString() : 'N/A'
      })));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Performance Report");
      XLSX.writeFile(workbook, "personal_performance_report.csv");
    } catch (error) {
      alert('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Performance Overview</h2>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm font-bold"
        >
          <Download size={18} />
          {exporting ? 'Generating...' : 'Export Performance Report'}
        </button>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Target size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500">Avg. Score</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{Math.round(metrics.average_score)}%</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <Award size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500">Completion</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics.assigned_count > 0 
              ? Math.round((metrics.completed_count / metrics.assigned_count) * 100) 
              : 0}%
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-violet-50 rounded-lg text-violet-600">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500">Exams Taken</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.completed_count}</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Performance Trend</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                hide 
              />
              <YAxis 
                domain={[0, 100]} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#4f46e5" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}