import { useEffect } from 'react';
import { useAuth } from './modules/auth';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './core';
import {
  Auth,
  PublicProfile,
  VerifyLinkHandler,
} from './modules/auth';
import {
  FacultyDashboard,
  ExamReview,
  LiveMonitor,
  ProctoringDashboard,
} from './modules/faculty';
import {
  StudentDashboard,
  StudentResults,
  PendingApproval,
  ExamInterface,
  StudentRoomView,
} from './modules/student';
import {
  AdminDashboard,
} from './modules/admin';
import {
  PublicExamDetails,
  PublicLeaderboard,
  PublicLeaderboardList,
} from './modules/exams';
import {
  RoomJoinHandler,
} from './modules/room';
import {
  AILearningHub,
} from './modules/ai';
import {
  PublicMaterialView,
} from './modules/learning';
import { useFCM } from './modules/notifications';

// Enterprise Phase 1 & 2 Imports
import { DeveloperPortalPage, DeveloperGuard } from './modules/developer';
import { NotFoundPage } from './modules/shared-pages';
import {
  InstitutionGuard,
  InstitutionPortalLayout,
  InstitutionDashboard,
  InstitutionSettings,
  LicensesPage,
  SubscriptionsPage,
  DownloadsPage,
  RoadmapsPage,
} from './modules/institution';

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
      {/* Hidden Developer Portal Route */}
      <Route
        path="/internal/developer"
        element={
          <DeveloperGuard>
            <DeveloperPortalPage />
          </DeveloperGuard>
        }
      />

      {/* Institution Portal Routes */}
      <Route
        path="/institution"
        element={
          <InstitutionGuard>
            <InstitutionPortalLayout />
          </InstitutionGuard>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<InstitutionDashboard />} />
        <Route path="roadmaps" element={<RoadmapsPage />} />
        <Route path="settings" element={<InstitutionSettings />} />
        <Route path="licenses" element={<LicensesPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="downloads" element={<DownloadsPage />} />
      </Route>

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
              <Route path="*" element={<NotFoundPage />} />
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
