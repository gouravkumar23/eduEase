"use client";

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Loader2, 
  Key,
  Plus,
  Trash2
} from 'lucide-react';
import { db } from '../../../../core/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function DevSettings() {
  const [apiKeys, setApiKeys] = useState<string[]>([]);
  const [newKeyInput, setNewKeyInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'system'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setApiKeys(data.gemini_api_keys || []);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKey = () => {
    const key = newKeyInput.trim();
    if (!key) return;
    if (apiKeys.includes(key)) {
      alert('This API key is already in the list.');
      return;
    }
    setApiKeys(prev => [...prev, key]);
    setNewKeyInput('');
  };

  const handleRemoveKey = (index: number) => {
    setApiKeys(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'system'), {
        gemini_api_keys: apiKeys
      }, { merge: true });
      alert('API keys updated successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to update API keys.');
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
          <Settings size={24} className="text-indigo-400" />
          System Settings
        </h2>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
          <label className="block text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Key size={18} className="text-indigo-400" />
            Manage API Keys (Round-Robin)
          </label>
          <div className="flex gap-2 mb-4">
            <input 
              type="password" 
              value={newKeyInput} 
              onChange={(e) => setNewKeyInput(e.target.value)} 
              className="flex-1 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
              placeholder="Add new Gemini API Key" 
            />
            <button 
              type="button"
              onClick={handleAddKey}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-2">
            {apiKeys.map((key, index) => (
              <div key={index} className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 h-6 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center text-[10px] font-black">
                    {index + 1}
                  </div>
                  <code className="text-xs text-slate-400 truncate">
                    {key.substring(0, 8)}••••••••{key.substring(key.length - 4)}
                  </code>
                </div>
                <button 
                  type="button"
                  onClick={() => handleRemoveKey(index)}
                  className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {apiKeys.length === 0 && (
              <p className="text-center py-4 text-xs text-slate-500 italic">No API keys added yet.</p>
            )}
          </div>
        </div>

        <button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Save Settings
        </button>
      </div>
    </div>
  );
}