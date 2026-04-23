import { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { notifyEvent } from '../utils/notifications';

interface ProctoringProps {
  attemptId: string;
  studentId: string;
  studentName: string;
  examId: string;
  examName: string;
  facultyId: string;
  submitting: boolean;
  onAutoSubmit: () => void;
  showToast: (msg: string) => void;
  onCaptureSnapshot: () => Promise<string | null>;
}

const VIOLATION_POINTS: Record<string, number> = {
  'no_face': 2,
  'multiple_faces': 3,
  'tab_switch': 2,
  'exit_fullscreen': 2,
  'devtools_open': 3,
  'copy_paste': 1,
  'mic_noise': 1
};

export const useProctoring = ({ 
  attemptId, 
  studentId, 
  studentName,
  examId, 
  examName,
  facultyId,
  submitting, 
  onAutoSubmit, 
  showToast,
  onCaptureSnapshot 
}: ProctoringProps) => {
  const [warnings, setWarnings] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [fullscreenNotSupported, setFullscreenNotSupported] = useState(false);
  const prevWarningsRef = useRef(0);
  const hasAutoSubmitted = useRef(false);
  const hasFlaggedSuspicious = useRef(false);
  const isGracePeriod = useRef(true);

  // End grace period after 5 seconds to allow for initialization/fullscreen transitions
  useEffect(() => {
    const timer = setTimeout(() => {
      isGracePeriod.current = false;
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const uploadToCloudinary = async (base64Image: string): Promise<string | null> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) return null;

    const formData = new FormData();
    formData.append('file', base64Image);
    formData.append('upload_preset', uploadPreset);
    formData.append('public_id', `violation_${attemptId}_${Date.now()}`);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      return data.secure_url;
    } catch (error) {
      console.error('Violation snapshot upload failed:', error);
      return null;
    }
  };

  const playSound = (type: 'warning' | 'buzzer') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      if (type === 'warning') {
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      } else {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      }
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + (type === 'warning' ? 0.2 : 1));
    } catch (e) {}
  };

  const handleViolation = async (type: string, reason: string) => {
    if (submitting || hasAutoSubmitted.current || isGracePeriod.current) return;
    
    const points = VIOLATION_POINTS[type] || 1;

    try {
      const base64 = await onCaptureSnapshot();
      let imageUrl = null;
      
      if (base64) {
        imageUrl = await uploadToCloudinary(base64);
      }

      await addDoc(collection(db, 'violations'), {
        studentId,
        studentName,
        examId,
        examName,
        facultyId,
        attemptId,
        type,
        imageUrl,
        details: reason,
        points_added: points,
        timestamp: serverTimestamp(),
      });

      const attemptRef = doc(db, 'attempts', attemptId);
      await updateDoc(attemptRef, {
        violation_count: increment(1),
        suspicion_score: increment(points),
        last_violation_at: serverTimestamp()
      });

      const updatedSnap = await getDoc(attemptRef);
      const currentScore = updatedSnap.data()?.suspicion_score || 0;

      if (currentScore >= 6 && !hasFlaggedSuspicious.current) {
        hasFlaggedSuspicious.current = true;
        await updateDoc(attemptRef, { is_highly_suspicious: true });

        const adminsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
        const adminIds = adminsSnap.docs.map(d => d.id);
        const recipients = Array.from(new Set([facultyId, ...adminIds]));

        await notifyEvent({
          type: 'error',
          title: 'Critical Integrity Alert',
          message: `High suspicion detected: ${studentName} in ${examName}`,
          userIds: recipients,
          link: `/faculty/monitor/${examId}`
        });
      }
      
      showToast(`Violation: ${type.replace('_', ' ')}`);
      
    } catch (error) {
      console.error('Failed to log violation:', error);
    }
  };

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS) setFullscreenNotSupported(true);
  }, []);

  useEffect(() => {
    if (warnings > prevWarningsRef.current) {
      if (warnings === 1) {
        playSound('warning');
      } else if (warnings === 2) {
        playSound('buzzer');
        speak("Suspicious activity detected. Further violations will result in automatic submission.");
      } else if (warnings >= 3 && !hasAutoSubmitted.current) {
        hasAutoSubmitted.current = true;
        speak("Maximum violations reached. Your exam is being submitted automatically.");
        onAutoSubmit();
      }
    }
    prevWarningsRef.current = warnings;
  }, [warnings, onAutoSubmit]);

  useEffect(() => {
    const handleVisibilityChange = () => { 
      if (document.hidden && !submitting) handleViolation('tab_switch', 'Tab switch or app exit detected'); 
    };
    const handleFullscreenChange = () => {
      const isFull = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isFull);
      if (!isFull && !submitting && !fullscreenNotSupported) handleViolation('exit_fullscreen', 'Exited fullscreen mode');
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      
      if (isCtrlOrCmd && ['c', 'v', 'x', 'a', 's', 'p', 'u'].includes(key)) {
        e.preventDefault();
        handleViolation('copy_paste', `Restricted keyboard shortcut: Ctrl+${key.toUpperCase()}`);
      }
      
      if ((isCtrlOrCmd && e.shiftKey && ['i', 'j', 'c'].includes(key)) || key === 'f12') {
        e.preventDefault();
        handleViolation('devtools_open', 'Developer tools shortcut detected');
      }
    };

    const devToolsThreshold = 160;
    const checkDevTools = () => {
      if (window.outerWidth - window.innerWidth > devToolsThreshold || window.outerHeight - window.innerHeight > devToolsThreshold) {
        if (!submitting) {
          handleViolation('devtools_open', 'Developer tools detected via window dimensions');
        }
      }
    };

    const devToolsInterval = setInterval(checkDevTools, 2000);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    const unsubscribeLogs = onSnapshot(doc(db, 'attempts', attemptId), (docSnap) => {
      if (docSnap.exists()) {
        setWarnings(docSnap.data().violation_count || 0);
      }
    });

    return () => {
      clearInterval(devToolsInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
      unsubscribeLogs();
    };
  }, [attemptId, submitting, fullscreenNotSupported]);

  const requestFullscreen = async () => {
    const element = document.documentElement;
    try {
      if (element.requestFullscreen) await element.requestFullscreen();
      else if ((element as any).webkitRequestFullscreen) await (element as any).webkitRequestFullscreen();
    } catch (err) {
      setFullscreenNotSupported(true);
    }
  };

  return { warnings, isFullscreen, fullscreenNotSupported, requestFullscreen, handleViolation };
};