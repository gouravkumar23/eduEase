import { useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import Auth from './components/Auth';
import FacultyDashboard from './components/FacultyDashboard';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import ExamInterface from './components/ExamInterface';
import ExamReview from './components/ExamReview';
import LiveMonitor from './components/LiveMonitor';
import ProctoringDashboard from './components/ProctoringDashboard';
import StudentResults from './components/StudentResults';
import PendingApproval from './components/PendingApproval';
import PublicProfile from './components/PublicProfile';
import PublicExamDetails from './components/PublicExamDetails';
import RoomJoinHandler from './components/RoomJoinHandler';
import PublicMaterialView from './components/PublicMaterialView';
import PublicLeaderboard from './components/PublicLeaderboard';
import PublicLeaderboardList from './components/PublicLeaderboardList';
import StudentRoomView from './components/StudentRoomView';
import VerifyLinkHandler from './components/VerifyLinkHandler';
import AILearningHub from './components/AILearningHub';
import { useFCM } from './hooks/useFCM';

function AppContent() {
  const { user, loading, logout, setSessionError } = useAuth();
  const location = useLocation();
  
  // Initialize FCM token registration and listeners
  useFCM();

  // Session Validation Logic
  useEffect(() => {
    const validateSession = async () => {
      if (!user) return;

      const localSessionId = localStorage.getItem("sessionId");
      if (!localSessionId) return; 

      try {
        const userDoc = await getDoc(doc(db, 'users', user.id));
        if (userDoc.exists()) {
          const activeSessionId = userDoc.data().activeSessionId;
          
          if (activeSessionId && localSessionId !== activeSessionId) {
            setSessionError("You were logged out because your account logged in elsewhere.");
            logout();
          }
        }
      } catch (error) {
        console.error("Session validation failed:", error);
      }
    };

    validateSession();
  }, [location.pathname, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Initializing EduEase...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/profile/:userId" element={<PublicProfile />} />
      <Route path="/exam-details/:examId" element={<PublicExamDetails />} />
      <Route path="/join/room/:roomId" element={<RoomJoinHandler />} />
      <Route path="/material/:materialId" element={<PublicMaterialView />} />
      <Route path="/leaderboard/:examId" element={<PublicLeaderboard />} />
      <Route path="/leaderboards" element={<PublicLeaderboardList />} />
      <Route path="/verify" element={<VerifyLinkHandler />} />
      
      {/* Auth Routes */}
      {!user || !user.emailVerified ? (
        <>
          <Route path="/auth/callback" element={<Auth />} />
          <Route path="*" element={<Auth />} />
        </>
      ) : (
        <>
          {/* Handle Pending Faculty */}
          {user.role === 'faculty' && user.status === 'pending' ? (
            <Route path="*" element={<PendingApproval />} />
          ) : (
            <>
              <Route path="/student" element={user.role === 'student' ? <StudentDashboard /> : <Navigate to="/" replace />} />
              <Route path="/student/results/:attemptId" element={user.role === 'student' ? <StudentResults /> : <Navigate to="/" replace />} />
              <Route path="/student/ai-hub" element={user.role === 'student' ? <AILearningHub /> : <Navigate to="/" replace />} />
              <Route path="/exam/:examId/:attemptId" element={user.role === 'student' ? <ExamInterface /> : <Navigate to="/" replace />} />
              <Route path="/room/:roomId" element={user.role === 'student' ? <StudentRoomView /> : <Navigate to="/" replace />} />
              <Route path="/faculty" element={user.role === 'faculty' ? <FacultyDashboard /> : <Navigate to="/" replace />} />
              <Route path="/faculty/review/:examId" element={user.role === 'faculty' ? <ExamReview /> : <Navigate to="/" replace />} />
              <Route path="/faculty/monitor/:examId" element={user.role === 'faculty' ? <LiveMonitor /> : <Navigate to="/" replace />} />
              <Route path="/faculty/proctoring/:examId" element={user.role === 'faculty' ? <ProctoringDashboard /> : <Navigate to="/" replace />} />
              <Route path="/admin" element={user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" replace />} />
              <Route path="/" element={<Navigate to={user.role === 'admin' ? "/admin" : user.role === 'faculty' ? "/faculty" : "/student"} replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </>
      )}
    </Routes>
  );
}

function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

export default App;