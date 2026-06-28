"use client";

import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Save, 
  Loader2, 
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function DevFeatureFlags() {
  const [flags, setFeatureFlags] = useState<Record<string, boolean>>({
    aiProctoring: true,
    voiceCoaching: true,
    bulkUpload: true,
    realtimeChat: true,
    analyticsDashboard: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'feature_flags'));
      if (docSnap.exists()) {
        setFeatureFlags(docSnap.data() as Record<string, boolean>);
      }
    } catch (error) {
      console.error('Error fetching feature flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: string) => {
    setFeatureFlags(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'feature_flags'), flags);
      alert('Feature flags updated successfully!');
    } catch (error) {
      console.error('Error saving feature flags:', error);
      alert('Failed to update feature flags.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
          <Zap size={24} className="text-indigo-400" />
          Feature Flags
        </h2>
      </div>

      <div className="space-y-4 mb-6">
        {Object.entries(flags).map(([key, val]) => (
          <div key={key} className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <p className="text-sm font-bold text-white capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
              <p className="text-xs text-slate-500">Enable or disable this feature globally</p>
            </div>
            <button type="button" onClick={() => handleToggle(key)} className="text-indigo-400">
              {val ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-slate-600" />}
            </button>
          </div>
        ))}
      </div>

      <button 
        onClick={handleSave} 
        disabled={saving}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50"
      >
        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
        Save Feature Flags
      </button>
    </div>
  );
}