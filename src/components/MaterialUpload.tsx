"use client";

import { useState } from 'react';
import { Upload, FileText, Loader2, X, CheckCircle2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface MaterialUploadProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const MaterialUpload = ({ onSuccess, onCancel }: MaterialUploadProps) => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.docx')) {
      setError('Only PDF, DOCX, and TXT files are allowed.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }

    setFile(selectedFile);
    setError('');
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !subject || !title || !user) return;

    setUploading(true);
    setError('');

    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error('Cloudinary configuration is missing in .env');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      
      // Removed access_mode as it is not allowed for unsigned uploads
      
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Upload to Cloudinary failed');
      }
      
      const data = await res.json();

      await addDoc(collection(db, 'materials'), {
        title,
        subject,
        fileURL: data.secure_url,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        uploadedBy: user.id,
        facultyName: user.name,
        timestamp: serverTimestamp()
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to upload material. Please try again.');
      console.error('Upload Error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Upload size={20} />
          <h3 className="font-bold">Upload Study Material</h3>
        </div>
        <button onClick={onCancel} className="text-white/80 hover:text-white"><X size={20} /></button>
      </div>

      <form onSubmit={handleUpload} className="p-6 space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Material Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            placeholder="e.g. Unit 1: Introduction to React"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            placeholder="e.g. Web Development"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Select File (PDF, DOCX, TXT)</label>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {file ? (
                <div className="flex items-center gap-2 text-indigo-600 font-bold">
                  <FileText size={24} />
                  <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-xs text-slate-500">Click to select a file</p>
                </>
              )}
            </div>
            <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileChange} />
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading || !file || !subject || !title}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                Confirm Upload
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MaterialUpload;