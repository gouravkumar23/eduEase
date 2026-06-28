"use client";

import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Save, 
  Loader2, 
  AlertTriangle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { db } from '../../../../core/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function DevSystemConfig() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [trialDays, setTrialDays] = useState(14);
  const [defaultPlan, setDefaultPlan] = useState('trial');
  const [devEmail, setDevEmail] = useState('dev@eduease.com');
  const [supportEmail, setSupportEmail] = useState('support@eduease.com');
  const [version, setVersion] = useState('1.0.0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'system_config'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMaintenanceMode(data.maintenanceMode || false);
        setTrialDays(data.trialDays || 14);
        setDefaultPlan(data.defaultPlan || 'trial');
        setDevEmail(data.devEmail || 'dev@eduease.com');
        setSupportEmail(data.supportEmail || 'support@eduease.com');
        setVersion(data.version || '1.0.0');
      }
    } catch (error) {
      console.error('Error fetching system config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await setDoc(doc(db, 'settings', 'system_config'), {
        maintenanceMode,
        trialDays,
        defaultPlan,
        devEmail,
        supportEmail,
        version,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert('System configuration updated successfully!');
    } catch (error) {
      console.error('Error saving system config:', error);
      alert('Failed to update system configuration.');
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
          <Sliders size={24} className="text-indigo-400" />
          System Configuration
        </h2>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
          <div>
            <p className="text-sm font-bold text-white">Maintenance Mode</p>
            <p className="text-xs text-slate-500">Restrict platform access to developers only</p>
          </div>
          <button type="button" onClick={() => setMaintenanceMode(!maintenanceMode)} className="text-indigo-400">
            {maintenanceMode ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-slate-600" />}
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Default Trial Days</label>
          <input 
            type="number" 
            value={trialDays} 
            onChange={(e) => setTrialDays(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Default Plan</label>
          <input 
            type="text" 
            value={defaultPlan} 
            onChange={(e) => setDefaultPlan(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Developer Contact Email</label>
          <input 
            type="email" 
            value={devEmail} 
            onChange={(e) => setDevEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Support Email</label>
          <input 
            type="email" 
            value={supportEmail} 
            onChange={(e) => setSupportEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Version Information</label>
          <input 
            type="text" 
            value={version} 
            onChange={(e) => setVersion(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Save Configuration
        </button>
      </form>
    </div>
  );
}