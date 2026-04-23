import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { 
  collection, query, getDocs, doc, updateDoc, where, 
  addDoc, serverTimestamp, Timestamp, writeBatch, getDoc, deleteDoc 
} from 'firebase/firestore';
import { generateAndSendViolationReport, notifyEvent } from '../utils/notifications';
import { templates } from '../utils/emailTemplates';

export interface Exam {
  id: string;
  title: string;
  duration: number;
  faculty_id: string;
  faculty_name: string;
  is_published: boolean;
  is_active: boolean;
  is_deleted?: boolean;
  results_released?: boolean;
  answer_key_released?: boolean;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'archived' | 'assigned' | 'completed';
  source: 'AI' | 'MANUAL';
  exam_mode: 'mixed' | 'quiz' | 'descriptive';
  start_time: any;
  end_time: any;
  created_at: any;
  target_type: 'section' | 'room';
  target_room_id?: string;
  target_branch?: string;
  target_year?: string | string[];
  target_section?: string | string[];
  questions_per_student?: number;
  easy_count?: number;
  medium_count?: number;
  hard_count?: number;
  score_easy?: number;
  score_medium?: number;
  score_hard?: number;
  total_score?: number;
  assigned_questions?: any[];
}

export const useExams = (readonly: boolean) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<Record<string, any>>({});
  const [distributingId, setDistributingId] = useState<string | null>(null);
  const [startingExamId, setStartingExamId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [notifyingId, setNotifyingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchExams();
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, [user]);

  const fetchExams = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const examsRef = collection(db, 'exams');
      let q;
      
      if (readonly) {
        // Students should see all approved or completed exams they are targeted for
        q = query(
          examsRef, 
          where('status', 'in', ['approved', 'completed'])
        );
      } else {
        q = query(examsRef, where('faculty_id', '==', user.id));
      }

      const querySnapshot = await getDocs(q);
      const examsData = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Exam))
        .filter(e => !e.is_deleted);
      
      examsData.sort((a, b) => (b.created_at?.toMillis?.() || 0) - (a.created_at?.toMillis?.() || 0));
      
      let filteredExams = examsData;

      if (readonly) {
        const roomMembershipsSnap = await getDocs(query(collection(db, 'room_members'), where('student_id', '==', user.id)));
        const myRoomIds = new Set(roomMembershipsSnap.docs.map(d => d.data().room_id));

        filteredExams = examsData.filter(exam => {
          if (exam.target_type === 'room') {
            return myRoomIds.has(exam.target_room_id || '');
          } else {
            const branchMatch = !exam.target_branch || exam.target_branch === 'ALL' || exam.target_branch === user.branch;
            let yearMatch = false;
            if (!exam.target_year || exam.target_year === 'ALL') {
              yearMatch = true;
            } else if (Array.isArray(exam.target_year)) {
              yearMatch = exam.target_year.includes(user.year || '');
            } else {
              yearMatch = exam.target_year === user.year;
            }
            let sectionMatch = false;
            if (!exam.target_section || exam.target_section === 'ALL') {
              sectionMatch = true;
            } else if (Array.isArray(exam.target_section)) {
              sectionMatch = exam.target_section.includes(user.section || '');
            } else {
              sectionMatch = exam.target_section === user.section;
            }
            return branchMatch && yearMatch && sectionMatch;
          }
        });
      }

      setExams(filteredExams);

      if (user.role === 'student') {
        for (const exam of filteredExams) {
          fetchAttempt(exam.id);
        }
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttempt = async (examId: string) => {
    if (!user) return;
    const q = query(collection(db, 'attempts'), where('exam_id', '==', examId), where('student_id', '==', user.id));
    const snap = await getDocs(q);
    if (!snap.empty) {
      setAttempts(prev => ({ ...prev, [examId]: { id: snap.docs[0].id, ...snap.docs[0].data() } }));
    }
  };

  const notifyStudents = async (examId: string) => {
    setNotifyingId(examId);
    try {
      const exam = exams.find(e => e.id === examId);
      if (!exam) return;

      let studentIds: string[] = [];

      if (exam.target_type === 'room') {
        const membersSnap = await getDocs(query(collection(db, 'room_members'), where('room_id', '==', exam.target_room_id)));
        studentIds = membersSnap.docs.map(d => d.data().student_id);
      } else {
        const usersRef = collection(db, 'users');
        let q = query(usersRef, where('role', '==', 'student'), where('status', '==', 'active'));
        const usersSnap = await getDocs(q);
        
        studentIds = usersSnap.docs
          .filter(d => {
            const u = d.data();
            const branchMatch = exam.target_branch === 'ALL' || exam.target_branch === u.branch;
            const yearMatch = exam.target_year === 'ALL' || exam.target_year === u.year;
            const sectionMatch = exam.target_section === 'ALL' || exam.target_section === u.section;
            return branchMatch && yearMatch && sectionMatch;
          })
          .map(d => d.id);
      }

      if (studentIds.length === 0) {
        alert('No students found matching the target criteria.');
        return;
      }

      await notifyEvent({
        type: 'info',
        title: 'New Assessment Ready',
        message: `The examination "${exam.title}" has been published. Please check your dashboard for details.`,
        userIds: studentIds,
        emailPayload: {
          subject: `New Exam Assigned: ${exam.title}`,
          html: templates.examAssigned('Student', exam.title, exam.id)
        },
        link: `/exam-details/${exam.id}`
      });

      alert(`Notification sent to ${studentIds.length} students.`);
    } catch (error) {
      console.error('Notification failed:', error);
      alert('Failed to send notifications.');
    } finally {
      setNotifyingId(null);
    }
  };

  const completeExam = async (examId: string) => {
    setCompletingId(examId);
    try {
      await updateDoc(doc(db, 'exams', examId), {
        status: 'completed',
        is_active: false,
        completed_at: serverTimestamp()
      });
      
      await generateAndSendViolationReport(examId);
      
      setExams(prev => prev.map(e => e.id === examId ? { ...e, status: 'completed', is_active: false } : e));
      alert('Exam marked as completed. Violation summary report has been sent to your email and administrators.');
    } catch (error) {
      console.error('Complete exam failed:', error);
      alert('Failed to complete exam.');
    } finally {
      setCompletingId(null);
    }
  };

  const submitForApproval = async (examId: string) => {
    try {
      const exam = exams.find(e => e.id === examId);
      await updateDoc(doc(db, 'exams', examId), { 
        status: 'pending_approval',
        updated_at: serverTimestamp()
      });

      const adminsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
      const adminIds = adminsSnap.docs.map(d => d.id);
      
      await notifyEvent({
        type: 'info',
        title: 'Exam Approval Request',
        message: `Faculty ${user?.name} submitted "${exam?.title}" for approval.`,
        userIds: adminIds,
        link: '/admin'
      });

      setExams(prev => prev.map(e => e.id === examId ? { ...e, status: 'pending_approval' } : e));
    } catch (error) {
      console.error('Submit for approval failed:', error);
      throw error;
    }
  };

  const toggleActive = async (examId: string, current: boolean) => {
    await updateDoc(doc(db, 'exams', examId), { is_active: !current });
    setExams(prev => prev.map(e => e.id === examId ? { ...e, is_active: !current } : e));
  };

  const togglePublish = async (examId: string, current: boolean) => {
    await updateDoc(doc(db, 'exams', examId), { is_published: !current });
    setExams(prev => prev.map(e => e.id === examId ? { ...e, is_published: !current } : e));
  };

  const toggleResults = async (examId: string, current: boolean) => {
    const newState = !current;
    await updateDoc(doc(db, 'exams', examId), { results_released: newState });
    setExams(prev => prev.map(e => e.id === examId ? { ...e, results_released: newState } : e));
    
    if (newState) {
      const exam = exams.find(e => e.id === examId);
      const attemptsSnap = await getDocs(query(collection(db, 'attempts'), where('exam_id', '==', examId)));
      const studentIds = Array.from(new Set(attemptsSnap.docs.map(d => d.data().student_id)));
      
      await notifyEvent({
        type: 'success',
        title: 'Scores Released!',
        message: `Your score for "${exam?.title || 'the exam'}" is now available.`,
        userIds: studentIds,
        link: '/student'
      });
    }
  };

  const toggleAnswerKey = async (examId: string, current: boolean) => {
    const newState = !current;
    await updateDoc(doc(db, 'exams', examId), { answer_key_released: newState });
    setExams(prev => prev.map(e => e.id === examId ? { ...e, answer_key_released: newState } : e));

    if (newState) {
      const exam = exams.find(e => e.id === examId);
      const attemptsSnap = await getDocs(query(collection(db, 'attempts'), where('exam_id', '==', examId)));
      const studentIds = Array.from(new Set(attemptsSnap.docs.map(d => d.data().student_id)));
      
      await notifyEvent({
        type: 'info',
        title: 'Answer Key Released!',
        message: `The correct answers for "${exam?.title || 'the exam'}" are now visible.`,
        userIds: studentIds,
        link: '/student'
      });
    }
  };

  const deleteExam = async (examId: string) => {
    try {
      await updateDoc(doc(db, 'exams', examId), { is_deleted: true });
      setExams(prev => prev.filter(e => e.id !== examId));
    } catch (error) {
      console.error('Delete failed:', error);
      throw error;
    }
  };

  const distributeQuestions = async (examId: string) => {
    setDistributingId(examId);
    try {
      const examDoc = await getDoc(doc(db, 'exams', examId));
      if (!examDoc.exists()) return;
      const examData = examDoc.data() as Exam;
      const { 
        easy_count = 0, medium_count = 0, hard_count = 0, 
        questions_per_student = 0,
        score_easy = 1, score_medium = 2, score_hard = 3
      } = examData;

      if (questions_per_student === 0 || (easy_count + medium_count + hard_count) !== questions_per_student) {
        alert('Please configure and save a valid question distribution first.');
        return;
      }

      const questionsSnap = await getDocs(query(collection(db, 'questions'), where('exam_id', '==', examId)));
      const allQuestions = questionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const easyPool = allQuestions.filter((q: any) => q.difficulty === 'easy');
      const mediumPool = allQuestions.filter((q: any) => q.difficulty === 'medium');
      const hardPool = allQuestions.filter((q: any) => q.difficulty === 'hard');

      if (easyPool.length < easy_count || mediumPool.length < medium_count || hardPool.length < hard_count) {
        alert(`Insufficient questions in pools. Easy: ${easyPool.length}/${easy_count}, Medium: ${mediumPool.length}/${medium_count}, Hard: ${hardPool.length}/${hard_count}`);
        return;
      }

      const pickRandom = (arr: any[], count: number) => {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
      };

      const selectedEasy = pickRandom(easyPool, easy_count).map(q => ({ ...q, score: score_easy }));
      const selectedMedium = pickRandom(mediumPool, medium_count).map(q => ({ ...q, score: score_medium }));
      const selectedHard = pickRandom(hardPool, hard_count).map(q => ({ ...q, score: score_hard }));
      
      const assignedQuestions = [...selectedEasy, ...selectedMedium, ...selectedHard];
      const totalScore = assignedQuestions.reduce((acc, q) => acc + (q.score || 0), 0);

      await updateDoc(doc(db, 'exams', examId), {
        assigned_questions: assignedQuestions,
        total_score: totalScore,
        updated_at: serverTimestamp()
      });

      alert(`Successfully allocated ${assignedQuestions.length} questions to the exam pool.`);
    } catch (error) {
      console.error('Distribution error:', error);
      alert('Failed to distribute questions.');
    } finally {
      setDistributingId(null);
    }
  };

  const startExam = async (exam: Exam) => {
    if (!user) return;
    setStartingExamId(exam.id);
    try {
      const expiresAt = new Date(Date.now() + exam.duration * 60000);
      const selectedQuestions = exam.assigned_questions || [];

      if (selectedQuestions.length === 0) {
        alert('No questions allocated to this exam yet. Please contact faculty.');
        return;
      }

      const attemptRef = await addDoc(collection(db, 'attempts'), {
        exam_id: exam.id,
        exam_title: exam.title,
        faculty_id: exam.faculty_id,
        faculty_name: exam.faculty_name,
        student_id: user.id,
        student_name: user.name,
        student_email: user.email,
        student_roll_number: user.rollNumber || 'N/A',
        student_branch: user.branch || 'N/A',
        student_section: user.section || 'N/A',
        status: 'IN_PROGRESS',
        started_at: serverTimestamp(),
        expires_at: Timestamp.fromDate(expiresAt),
        total_exam_score: exam.total_score || 0
      });

      const batch = writeBatch(db);
      selectedQuestions.forEach((q: any) => {
        batch.set(doc(collection(db, 'allocations')), {
          attempt_id: attemptRef.id,
          question_id: q.id,
          student_answer: '',
          questions: q,
          score_weight: q.score || 1
        });
      });
      await batch.commit();
      navigate(`/exam/${exam.id}/${attemptRef.id}`);
    } finally {
      setStartingExamId(null);
    }
  };

  const forceSubmit = async (attemptId: string) => {
    try {
      await updateDoc(doc(db, 'attempts', attemptId), {
        status: 'AUTO_SUBMITTED',
        submitted_at: serverTimestamp(),
        force_submitted_by_faculty: true
      });
    } catch (error) {
      console.error('Force submit failed:', error);
      throw error;
    }
  };

  const terminateAttempt = async (attemptId: string) => {
    try {
      await updateDoc(doc(db, 'attempts', attemptId), {
        status: 'TERMINATED',
        terminated_at: serverTimestamp(),
        submitted_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Termination failed:', error);
      throw error;
    }
  };

  const resetAttempt = async (attemptId: string) => {
    try {
      const q = query(collection(db, 'allocations'), where('attempt_id', '==', attemptId));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => {
        batch.update(d.ref, { student_answer: '' });
      });
      await batch.commit();

      await updateDoc(doc(db, 'attempts', attemptId), {
        last_reset_at: serverTimestamp(),
        status: 'IN_PROGRESS'
      });
    } catch (error) {
      console.error('Reset failed:', error);
      throw error;
    }
  };

  const restartAttempt = async (attemptId: string) => {
    try {
      const q = query(collection(db, 'allocations'), where('attempt_id', '==', attemptId));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      await deleteDoc(doc(db, 'attempts', attemptId));
    } catch (error) {
      console.error('Restart failed:', error);
      throw error;
    }
  };

  const resumeAttempt = async (attemptId: string, additionalMinutes: number = 10) => {
    try {
      const newExpiresAt = new Date(Date.now() + additionalMinutes * 60000);
      await updateDoc(doc(db, 'attempts', attemptId), {
        status: 'IN_PROGRESS',
        expires_at: Timestamp.fromDate(newExpiresAt),
        resumed_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Resume failed:', error);
      throw error;
    }
  };

  return { 
    exams, loading, attempts, distributingId, startingExamId, completingId, notifyingId, currentTime,
    toggleActive, togglePublish, toggleResults, toggleAnswerKey, deleteExam, distributeQuestions, startExam,
    forceSubmit, terminateAttempt, resetAttempt, restartAttempt, resumeAttempt, submitForApproval, completeExam, notifyStudents
  };
};