import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FileText, User, X, Calendar, BookOpen, Info, Users, Clock, Hash } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { notifyEvent } from '../utils/notifications';
import { templates } from '../utils/emailTemplates';

interface AssignmentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const BRANCHES = ['CSE', 'IT', 'MECH', 'CIVIL', 'CSD', 'CSM', 'AIML'];
const YEARS = ['1', '2', '3', '4'];
const SECTIONS = ['A', 'B', 'C', 'D'];

export default function AssignmentForm({ onSuccess, onCancel }: AssignmentFormProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [duration, setDuration] = useState('60');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [deadline, setDeadline] = useState('');
  const [instructions, setInstructions] = useState('');
  
  const [targetType, setTargetType] = useState<'section' | 'room'>('section');
  const [targetRoomId, setTargetRoomId] = useState('');
  const [targetBranch, setTargetBranch] = useState('ALL');
  const [targetYear, setTargetYear] = useState('ALL');
  const [targetSection, setTargetSection] = useState('ALL');

  const [faculties, setFaculties] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchFaculties = async () => {
      const q = query(collection(db, 'users'), where('role', '==', 'faculty'), where('status', '==', 'active'));
      const snap = await getDocs(q);
      setFaculties(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchFaculties();
  }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!facultyId) {
        setRooms([]);
        return;
      }
      const q = query(
        collection(db, 'rooms'), 
        where('faculty_id', '==', facultyId),
        where('status', '==', 'approved')
      );
      const snap = await getDocs(q);
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchRooms();
  }, [facultyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !facultyId) return;
    setError('');
    
    const deadlineDate = new Date(deadline);
    const startDate = startTime ? new Date(startTime) : null;
    const endDate = endTime ? new Date(endTime) : null;
    const dur = parseInt(duration);

    if (dur <= 0) {
      setError('Duration must be greater than 0');
      return;
    }

    if (startDate && endDate && startDate >= endDate) {
      setError('Exam End Time must be after Start Time');
      return;
    }

    if (deadlineDate <= new Date()) {
      setError('Submission Deadline must be in the future');
      return;
    }

    if (targetType === 'room' && !targetRoomId) {
      setError('Please select a target room');
      return;
    }

    setLoading(true);
    const selectedFaculty = faculties.find(f => f.id === facultyId);

    try {
      await addDoc(collection(db, 'exams'), {
        title,
        subject,
        duration: dur,
        exam_mode: 'mixed',
        start_time: startDate ? Timestamp.fromDate(startDate) : null,
        end_time: endDate ? Timestamp.fromDate(endDate) : null,
        task_deadline: Timestamp.fromDate(deadlineDate),
        faculty_id: facultyId,
        faculty_name: selectedFaculty?.name || 'Unknown',
        instructions,
        target_type: targetType,
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
        status: 'assigned',
        is_published: false,
        is_active: false,
        created_at: serverTimestamp(),
      });

      // Centralized Notification
      await notifyEvent({
        type: 'info',
        title: 'New Assessment Task',
        message: `Admin has assigned you to create questions for "${title}". Deadline: ${deadlineDate.toLocaleDateString()}.`,
        userIds: [facultyId],
        emailPayload: {
          subject: 'New Faculty Task Assigned',
          html: templates.taskAssigned(selectedFaculty?.name || 'Faculty', title, deadlineDate.toLocaleDateString())
        },
        link: '/faculty'
      });

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">Assign Assessment Task</h3>
        <button onClick={onCancel} className="text-indigo-100 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Assessment Title</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Final Year Project Viva"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject / Topic</label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Computer Science"
                  required
                />
              </div>
            </div>
          </div>

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
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Branch</label>
                  <select value={targetBranch} onChange={(e) => setTargetBranch(e.target.value)} className="w-full px-4 py-2.5 bg-white border rounded-xl outline-none">
                    <option value="ALL">All Branches</option>
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Year</label>
                  <select value={targetYear} onChange={(e) => setTargetYear(e.target.value)} className="w-full px-4 py-2.5 bg-white border rounded-xl outline-none">
                    <option value="ALL">All Years</option>
                    {YEARS.map(y => <option key={y} value={y}>{y} Year</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Section</label>
                  <select value={targetSection} onChange={(e) => setTargetSection(e.target.value)} className="w-full px-4 py-2.5 bg-white border rounded-xl outline-none">
                    <option value="ALL">All Sections</option>
                    {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in duration-200">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Select Faculty Room</label>
                <select 
                  value={targetRoomId} 
                  onChange={(e) => setTargetRoomId(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none"
                  required={targetType === 'room'}
                  disabled={!facultyId}
                >
                  <option value="">{facultyId ? 'Select a Room' : 'Select Faculty First'}</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Exam Start Time</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Exam End Time</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Duration (min)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="60"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Assign to Faculty</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  value={facultyId}
                  onChange={(e) => setFacultyId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  required
                >
                  <option value="">Select Faculty</option>
                  {faculties.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Submission Deadline</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tasks & Instructions</label>
            <div className="relative">
              <Info className="absolute left-3 top-3 text-slate-400" size={18} />
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                rows={4}
                placeholder="Enter specific tasks or question requirements for the faculty..."
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
            >
              {loading ? 'Assigning...' : 'Assign Task'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}