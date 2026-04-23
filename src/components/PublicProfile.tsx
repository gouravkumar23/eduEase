"use client";

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, GraduationCap, Building2, Share2, Check, ArrowLeft, ShieldCheck, BookOpen } from 'lucide-react';

interface PublicUserData {
  name: string;
  role: string;
  branch?: string;
  institution?: string;
  bio?: string;
  avatar?: string;
}

export default function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          // Strictly pick only public fields
          setProfile({
            name: data.name || 'Anonymous User',
            role: data.role || 'User',
            branch: data.branch,
            institution: data.institution || 'EduEase Member',
            bio: data.bio,
            avatar: data.avatar
          });
        }
      } catch (error) {
        console.error("Error fetching public profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
          <User size={40} className="text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Profile Not Found</h1>
        <p className="text-slate-500 mt-2">The user profile you are looking for does not exist or has been removed.</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-8 flex items-center gap-2 text-indigo-600 font-bold hover:underline"
        >
          <ArrowLeft size={20} /> Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Header/Cover Area */}
          <div className="h-32 bg-gradient-to-r from-indigo-600 to-violet-600 relative">
            <button 
              onClick={() => navigate('/')}
              className="absolute top-4 left-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all backdrop-blur-md"
            >
              <ArrowLeft size={20} />
            </button>
          </div>

          <div className="px-8 pb-8 relative">
            {/* Avatar */}
            <div className="absolute -top-12 left-8">
              {profile.avatar ? (
                <img 
                  src={profile.avatar} 
                  alt={profile.name} 
                  className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center">
                  <User size={40} />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-4">
              <button 
                onClick={handleShare}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                  copied ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {copied ? <Check size={18} /> : <Share2 size={18} />}
                {copied ? 'Link Copied' : 'Share Profile'}
              </button>
            </div>

            {/* Info */}
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold text-slate-900">{profile.name}</h1>
                {profile.role === 'faculty' && <ShieldCheck className="text-indigo-500" size={24} />}
              </div>
              <p className="text-indigo-600 font-bold uppercase tracking-widest text-xs mb-6">
                {profile.role} Member
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="p-2 bg-white rounded-lg text-slate-400">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Institution</p>
                    <p className="text-sm font-bold text-slate-700">{profile.institution}</p>
                  </div>
                </div>
                {profile.branch && (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="p-2 bg-white rounded-lg text-slate-400">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Department</p>
                      <p className="text-sm font-bold text-slate-700">{profile.branch}</p>
                    </div>
                  </div>
                )}
              </div>

              {profile.bio && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">About</h3>
                  <p className="text-slate-600 leading-relaxed">{profile.bio}</p>
                </div>
              )}

              <div className="pt-8 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400">
                <BookOpen size={16} />
                <span className="text-xs font-medium">Verified EduEase Profile</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}