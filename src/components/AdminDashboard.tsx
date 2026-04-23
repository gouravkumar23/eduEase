import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Menu } from 'lucide-react';
import AssignmentForm from './AssignmentForm';
import AdminRoomApprovals from './AdminRoomApprovals';
import AdminViolations from './AdminViolations';
import AdminProfileApprovals from './AdminProfileApprovals';
import GeminiAssistant from './GeminiAssistant';
import ConfirmationModal from './ConfirmationModal';
import AdminSidebar from './AdminSidebar';
import AdminStats from './AdminStats';
import AdminUserManagement from './AdminUserManagement';
import AdminExamApprovals from './AdminExamApprovals';
import AdminAssessmentList from './AdminAssessmentList';
import AdminSettings from './AdminSettings';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy, onSnapshot, where, deleteDoc } from 'firebase/firestore';
import { notifyEvent } from '../utils/notifications';

export interface Exam {
  id: string;
  title: string;
  faculty_id: string;
  faculty_name: string;
  start_time: any;
  end_time: any;
  is_active: boolean;
  is_deleted?: boolean;
  status: string;
  created_at: any;
  target_type: 'section' | 'room';
  target_branch?: string;
  target_year?: string;
  target_section?: string;
  subject?: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  branch?: string;
  year?: string;
  section?: string;
  rollNumber?: string;
}

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'students' | 'faculty' | 'exams' | 'approvals' | 'rooms' | 'violations' | 'settings' | 'profile-updates'>('stats');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [pendingRoomsCount, setPendingRoomsCount] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [userToDelete, setUserToDelete] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    fetchData();
    const q = query(collection(db, 'rooms'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setPendingRoomsCount(snap.size);
    });
    return () => unsubscribe();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as UserData[]);

      const examsSnap = await getDocs(query(collection(db, 'exams'), orderBy('created_at', 'desc')));
      const examsData = examsSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as Exam))
        .filter(e => !e.is_deleted);
      setExams(examsData);

      const attemptsSnap = await getDocs(collection(db, 'attempts'));
      setAttemptsCount(attemptsSnap.size);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const handleApproveExam = async (examId: string, facultyId: string, title: string) => {
    setProcessingId(examId);
    try {
      await updateDoc(doc(db, 'exams', examId), { status: 'approved', is_active: false });
      await notifyEvent({
        type: 'success',
        title: 'Exam Approved',
        message: `Your exam "${title}" has been approved. You can now unlock it for students.`,
        userIds: [facultyId],
        link: '/faculty'
      });
      setExams(prev => prev.map(e => e.id === examId ? { ...e, status: 'approved', is_active: false } : e));
    } catch (error) {
      alert('Approval failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectExam = async (examId: string, facultyId: string, title: string) => {
    setProcessingId(examId);
    try {
      await updateDoc(doc(db, 'exams', examId), { status: 'rejected' });
      await notifyEvent({
        type: 'error',
        title: 'Exam Rejected',
        message: `Your exam "${title}" has been rejected by the administrator.`,
        userIds: [facultyId],
        link: '/faculty'
      });
      setExams(prev => prev.map(e => e.id === examId ? { ...e, status: 'rejected' } : e));
    } catch (error) {
      alert('Rejection failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteExam = async () => {
    if (!examToDelete) return;
    try {
      await updateDoc(doc(db, 'exams', examToDelete.id), { is_deleted: true });
      setExams(prev => prev.filter(e => e.id !== examToDelete.id));
      setExamToDelete(null);
    } catch (error) {
      alert('Delete failed');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setProcessingId(userToDelete.id);
    try {
      await deleteDoc(doc(db, 'users', userToDelete.id));
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (error) {
      alert('Failed to delete user');
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveFaculty = async (userId: string) => {
    setProcessingId(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { status: 'active' });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' } : u));
      await notifyEvent({
        type: 'success',
        title: 'Account Approved',
        message: 'Your faculty account has been approved. You can now access your dashboard.',
        userIds: [userId],
        link: '/faculty'
      });
    } catch (error) {
      alert('Approval failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    setProcessingId(userId);
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (error) {
      alert('Update failed');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingExams = exams.filter(e => e.status === 'pending_approval');
  const approvedExams = exams.filter(e => e.status === 'approved' || e.status === 'rejected' || e.status === 'completed');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <ConfirmationModal 
        isOpen={!!examToDelete}
        title="Delete Assessment"
        message={`Are you sure you want to delete "${examToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDeleteExam}
        onCancel={() => setExamToDelete(null)}
      />

      <ConfirmationModal 
        isOpen={!!userToDelete}
        title="Remove User"
        message={`Are you sure you want to permanently remove ${userToDelete?.name}? This will delete their profile and access.`}
        confirmText="Remove Permanently"
        variant="danger"
        onConfirm={handleDeleteUser}
        onCancel={() => setUserToDelete(null)}
      />

      <AdminSidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        pendingExamsCount={pendingExams.length}
        pendingRoomsCount={pendingRoomsCount}
        onLogout={logout}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 sm:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-bold text-slate-800 capitalize">
              {activeTab === 'approvals' ? 'Exam Approvals' : activeTab === 'rooms' ? 'Room Approvals' : activeTab.replace('-', ' ')}
            </h1>
          </div>
          {activeTab === 'exams' && (
            <button onClick={() => setShowAssignForm(true)} className="bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm shadow-sm shadow-indigo-100">
              Assign Task
            </button>
          )}
        </header>

        <div className="p-4 sm:p-8 max-w-6xl w-full mx-auto">
          {showAssignForm && (
            <div className="mb-8">
              <AssignmentForm onSuccess={() => setShowAssignForm(false)} onCancel={() => setShowAssignForm(false)} />
            </div>
          )}

          {activeTab === 'stats' && (
            <AdminStats stats={{
              faculty: users.filter(u => u.role === 'faculty').length,
              students: users.filter(u => u.role === 'student').length,
              exams: exams.length,
              submissions: attemptsCount
            }} />
          )}
          
          {activeTab === 'settings' && <AdminSettings />}
          
          {activeTab === 'approvals' && (
            <AdminExamApprovals 
              exams={pendingExams} 
              onApprove={handleApproveExam} 
              onReject={handleRejectExam} 
              processingId={processingId} 
            />
          )}
          
          {activeTab === 'rooms' && <AdminRoomApprovals />}
          {activeTab === 'violations' && <AdminViolations />}
          {activeTab === 'profile-updates' && <AdminProfileApprovals />}
          
          {activeTab === 'exams' && (
            <AdminAssessmentList exams={approvedExams} onDelete={(e) => setExamToDelete(e as Exam)} />
          )}
          
          {(activeTab === 'students' || activeTab === 'faculty') && (
            <AdminUserManagement 
              users={users} 
              role={activeTab === 'students' ? 'student' : 'faculty'} 
              onApprove={handleApproveFaculty} 
              onToggleStatus={handleToggleUserStatus} 
              onDelete={async (id, name) => setUserToDelete({id, name})}
              processingId={processingId} 
            />
          )}
        </div>
      </main>
      <GeminiAssistant role="admin" />
    </div>
  );
}