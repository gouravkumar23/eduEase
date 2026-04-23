import { useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getMessagingInstance, db } from '../lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export const useFCM = () => {
  const { user } = useAuth();

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      console.warn('Sound playback failed:', e);
    }
  };

  useEffect(() => {
    const setupFCM = async () => {
      if (!user) return;

      try {
        const messaging = await getMessagingInstance();
        if (!messaging) {
          console.warn('[FCM] Messaging not supported in this browser.');
          return;
        }

        // 1. Register Service Worker with Config in URL
        const config = {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID
        };

        const queryParams = new URLSearchParams(config).toString();
        const swUrl = `/firebase-messaging-sw.js?${queryParams}`;

        const registration = await navigator.serviceWorker.register(swUrl, {
          scope: '/'
        });

        // 2. Request Permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('[FCM] Notification permission denied.');
          return;
        }

        // 3. Get Token
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
          console.error('[FCM] VITE_FIREBASE_VAPID_KEY is missing in .env');
          return;
        }

        const token = await getToken(messaging, { 
          vapidKey,
          serviceWorkerRegistration: registration 
        });

        if (token) {
          // 4. Save to Firestore if changed
          const userRef = doc(db, 'users', user.id);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists() && userSnap.data().fcmToken !== token) {
            await updateDoc(userRef, { fcmToken: token });
            console.log('[FCM] Token updated in Firestore');
          }
        }

        // 5. Handle Foreground Messages
        onMessage(messaging, (payload) => {
          console.log('[FCM] Foreground message received:', payload);
          
          // Play sound for foreground notifications
          playNotificationSound();

          if (payload.notification) {
            new Notification(payload.notification.title || 'EduEase', {
              body: payload.notification.body,
              icon: '/vite.svg',
            });
          }
        });

      } catch (error: any) {
        console.error('[FCM_SETUP_ERROR]', error.message);
      }
    };

    setupFCM();
  }, [user]);
};