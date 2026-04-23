"use client";

import { useState, useEffect } from 'react';
import { Globe, Loader2, Save, Send, ShieldCheck, AlertCircle, BrainCircuit, Cpu, Plus, Trash2, Key } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash'
];

export default function AdminSettings() {
  const { user } = useAuth();
  const [emailServiceUrl, setEmailServiceUrl] = useState('');
  const [apiKeys, setApiKeys] = useState<string[]>([]);
  const [newKeyInput, setNewKeyInput] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-2.0-flash');
  const [customModels, setCustomModels] = useState<string[]>([]);
  const [newModelInput, setNewModelInput] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'system'));
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          setEmailServiceUrl(data.email_service_url || '');
          
          // Handle migration from single key to array
          const keys = data.gemini_api_keys || (data.gemini_api_key ? [data.gemini_api_key] : []);
          setApiKeys(keys);
          
          setGeminiModel(data.gemini_model || 'gemini-2.0-flash');
          setCustomModels(data.gemini_custom_models || []);
        }
      } catch (error) {
        console.error('Settings fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

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

  const handleAddCustomModel = () => {
    const model = newModelInput.trim().toLowerCase();
    if (!model) return;
    if (DEFAULT_MODELS.includes(model) || customModels.includes(model)) {
      alert('Model already exists in the list.');
      return;
    }
    setCustomModels(prev => [...prev, model]);
    setNewModelInput('');
  };

  const handleRemoveCustomModel = (model: string) => {
    setCustomModels(prev => prev.filter(m => m !== model));
    if (geminiModel === model) {
      setGeminiModel('gemini-2.0-flash');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKeys.length === 0) {
      alert('Please add at least one Gemini API key.');
      return;
    }
    setSaving(true);
    setLastError(null);
    try {
      await setDoc(doc(db, 'settings', 'system'), {
        email_service_url: emailServiceUrl,
        gemini_api_keys: apiKeys,
        gemini_model: geminiModel,
        gemini_custom_models: customModels,
        updated_at: serverTimestamp()
      }, { merge: true });
      alert('System settings updated successfully. Round-robin rotation enabled for ' + apiKeys.length + ' keys.');
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!user?.email || !emailServiceUrl) return;
    setTesting(true);
    setLastError(null);
    
    try {
      const res = await fetch(`${emailServiceUrl}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          subject: 'EduEase Relay Test',
          html: '<h3>Relay is working!</h3><p>This email was sent via the Quiz Backend relaying to the Universal Mailer.</p>',
          text: 'Relay is working!',
          isOTP: false
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Test email sent successfully to ${user.email}`);
      } else {
        const errorMsg = data.error || 'Unknown relay error';
        setLastError(errorMsg);
        alert(`Relay Failed: ${errorMsg}`);
      }
    } catch (error: any) {
      const msg = error.message || 'Network connection failed';
      setLastError(msg);
      alert(`Critical Failure: ${msg}`);
    } finally {
      setTesting(false);
    }
  };

  const allModels = Array.from(new Set([...DEFAULT_MODELS, ...customModels]));

  if (loading) return <div className="py-12 text-center text-slate-500">Loading settings...</div>;

  return (
    <div className="max-w-2xl space-y-8">
      <div className="bg-white rounded-3xl border p-6 sm:p-8 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Globe size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Backend Configuration</h2>
              <p className="text-xs text-slate-500">Configure the Quiz Backend and AI Engine settings.</p>
            </div>
          </div>
          <button 
            onClick={handleTestEmail}
            disabled={testing || !emailServiceUrl}
            className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-all disabled:opacity-50"
          >
            {testing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Test Relay
          </button>
        </div>

        {lastError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-600 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-bold">Last Error Detected</p>
              <p className="text-xs opacity-90">{lastError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* Email Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Send size={14} /> Email Relay Settings
            </h3>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Quiz Backend URL</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="url" 
                  value={emailServiceUrl} 
                  onChange={(e) => setEmailServiceUrl(e.target.value)} 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                  placeholder="https://eduease-api.onrender.com" 
                  required 
                />
              </div>
            </div>
          </div>

          {/* AI Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <BrainCircuit size={14} /> Gemini AI Configuration
            </h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Key size={18} className="text-indigo-600" />
                  Manage API Keys (Round-Robin)
                </label>
                <div className="flex gap-2 mb-4">
                  <input 
                    type="password" 
                    value={newKeyInput} 
                    onChange={(e) => setNewKeyInput(e.target.value)} 
                    className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
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
                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-black">
                          {index + 1}
                        </div>
                        <code className="text-xs text-slate-500 truncate">
                          {key.substring(0, 8)}••••••••{key.substring(key.length - 4)}
                        </code>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleRemoveKey(index)}
                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {apiKeys.length === 0 && (
                    <p className="text-center py-4 text-xs text-slate-400 italic">No API keys added yet.</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Active Model</label>
                  <div className="relative">
                    <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select 
                      value={geminiModel} 
                      onChange={(e) => setGeminiModel(e.target.value)} 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                      required
                    >
                      {allModels.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Add Custom Model</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newModelInput}
                      onChange={(e) => setNewModelInput(e.target.value)}
                      placeholder="e.g. gemini-2.5-flash"
                      className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button 
                      type="button"
                      onClick={handleAddCustomModel}
                      className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  
                  {customModels.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {customModels.map(m => (
                        <div key={m} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600">
                          {m}
                          <button 
                            type="button"
                            onClick={() => handleRemoveCustomModel(m)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex gap-3">
            <ShieldCheck className="text-indigo-600 shrink-0" size={20} />
            <p className="text-[10px] text-indigo-700 leading-relaxed">
              <strong>Security Note:</strong> These keys are stored in your private Firestore instance. The system will perform round-robin selection to distribute load across all active keys.
            </p>
          </div>

          <button 
            type="submit" 
            disabled={saving} 
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Save All Settings
          </button>
        </form>
      </div>
    </div>
  );
}