import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, ShieldCheck, ShieldAlert, Mic, User, Users } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useParams } from 'react-router-dom';

interface CameraProctorProps {
  onViolation: (type: string, reason: string) => void;
}

export interface CameraProctorHandle {
  takeSnapshot: () => Promise<string | null>;
}

const CameraProctor = forwardRef<CameraProctorHandle, CameraProctorProps>(({ onViolation }, ref) => {
  const { attemptId } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [faceStatus, setFaceStatus] = useState<'detected' | 'missing' | 'multiple'>('missing');
  const [noiseLevel, setNoiseLevel] = useState(0);
  
  const noFaceCounter = useRef(0);
  const multiFaceCounter = useRef(0);
  const noiseCounter = useRef(0);
  
  const intervalRef = useRef<any>(null);
  const snapshotIntervalRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micIntervalRef = useRef<any>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Expose takeSnapshot to parent
  useImperativeHandle(ref, () => ({
    takeSnapshot: async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL('image/jpeg', 0.7);
        }
      }
      return null;
    }
  }));

  useEffect(() => {
    loadModels();
    startMicrophone();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (micIntervalRef.current) clearInterval(micIntervalRef.current);
      if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current);
      stopCamera();
      stopMicrophone();
    };
  }, []);

  const loadModels = async () => {
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      setModelsLoaded(true);
      startCamera();
    } catch (err) {
      console.error('Failed to load face-api models');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 },
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsMonitoring(true);
          startDetection();
          startSnapshotReporting();
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const startMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      microphone.connect(analyser);
      analyser.fftSize = 256;
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      startMicDetection();
    } catch (err) {
      console.error('Microphone access error:', err);
    }
  };

  const stopMicrophone = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const startDetection = () => {
    intervalRef.current = setInterval(async () => {
      if (videoRef.current && modelsLoaded && videoRef.current.readyState === 4) {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        );

        if (detections.length === 0) {
          setFaceStatus('missing');
          noFaceCounter.current++;
          if (noFaceCounter.current >= 7) {
            onViolation('no_face', 'No face detected for 7+ seconds');
            noFaceCounter.current = 0;
          }
        } else if (detections.length > 1) {
          setFaceStatus('multiple');
          multiFaceCounter.current++;
          if (multiFaceCounter.current >= 5) {
            onViolation('multiple_faces', 'Multiple faces detected in frame');
            multiFaceCounter.current = 0;
          }
        } else {
          setFaceStatus('detected');
          noFaceCounter.current = 0;
          multiFaceCounter.current = 0;
        }
      }
    }, 1000);
  };

  const startMicDetection = () => {
    const threshold = 75; // Lowered threshold for better sensitivity
    micIntervalRef.current = setInterval(() => {
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        
        setNoiseLevel(Math.round(average));

        if (average > threshold) {
          noiseCounter.current++;
          if (noiseCounter.current >= 3) {
            onViolation('mic_noise', 'Persistent high noise level detected');
            noiseCounter.current = 0;
          }
        } else {
          noiseCounter.current = 0;
        }

        if (attemptId) {
          updateDoc(doc(db, 'attempts', attemptId), {
            live_noise_level: Math.round(average),
            last_heartbeat: serverTimestamp()
          }).catch(() => {});
        }
      }
    }, 1000);
  };

  const uploadToCloudinary = async (base64Image: string, isLiveSnapshot = false, retries = 2): Promise<string | null> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) return null;

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const formData = new FormData();
    formData.append('file', base64Image);
    formData.append('upload_preset', uploadPreset);
    
    if (isLiveSnapshot && attemptId) {
      formData.append('public_id', `live_snapshot_${attemptId}`);
    }

    try {
      const response = await fetch(url, { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Cloudinary Error');
      const data = await response.json();
      return isLiveSnapshot ? `${data.secure_url}?t=${Date.now()}` : data.secure_url;
    } catch (error) {
      if (retries > 0) return uploadToCloudinary(base64Image, isLiveSnapshot, retries - 1);
      return null;
    }
  };

  const startSnapshotReporting = () => {
    if (!attemptId) return;

    snapshotIntervalRef.current = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        const canvas = document.createElement('canvas');
        canvas.width = 320; 
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const base64Image = canvas.toDataURL('image/jpeg', 0.6);
          const cloudinaryUrl = await uploadToCloudinary(base64Image, true);
          if (cloudinaryUrl) {
            updateDoc(doc(db, 'attempts', attemptId), {
              live_snapshot: cloudinaryUrl,
              last_snapshot_at: serverTimestamp()
            }).catch(() => {});
          }
        }
      }
    }, 30000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-xs flex items-center gap-2 text-slate-700">
          <Camera size={16} className={isMonitoring ? "text-indigo-600" : "text-slate-400"} />
          Live Proctoring
        </h3>
        {isMonitoring ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase">
            <ShieldCheck size={12} /> Active
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
            <ShieldAlert size={12} /> Initializing
          </span>
        )}
      </div>
      
      <div className="relative rounded-lg overflow-hidden bg-slate-900 aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          playsInline
        />
        
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold backdrop-blur-md ${
            faceStatus === 'detected' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
            faceStatus === 'multiple' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
            'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            {faceStatus === 'detected' ? <User size={12} /> : <Users size={12} />}
            {faceStatus === 'detected' ? 'Face Detected' : faceStatus === 'multiple' ? 'Multiple Faces' : 'No Face Detected'}
          </div>
        </div>

        <div className="absolute bottom-2 left-2 right-2">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md p-2 rounded-lg border border-white/10">
            <Mic size={12} className={noiseLevel > 70 ? "text-rose-400" : "text-emerald-400"} />
            <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${noiseLevel > 70 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, (noiseLevel / 100) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-white min-w-[30px]">{noiseLevel}dB</span>
          </div>
        </div>

        {!isMonitoring && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
});

export default CameraProctor;