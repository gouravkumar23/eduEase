"use client";

import React, { useState } from 'react';
import { Settings, Save, ToggleLeft, ToggleRight } from 'lucide-react';

export default function InstitutionSettings() {
  const [settings, setSettings] = useState({
    secureBrowserRequired: false,
    aiEnabled: true,
    roadmapsEnabled: false,
    questionGeneratorEnabled: true,
    analyticsEnabled: true,
    developerMessagesEnabled: true,
    downloadsEnabled: true
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-2xl bg-white rounded-2xl border p-6 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings size={24} className="text-indigo-600" />
          Institution Settings
        </h2>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <p className="text-sm font-bold text-slate-800">Secure Browser Required</p>
            <p className="text-xs text-slate-500">Force students to use the secure browser client</p>
          </div>
          <button onClick={() => toggleSetting('secureBrowserRequired')} className="text-indigo-600">
            {settings.secureBrowserRequired ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-slate-400" />}
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <p className="text-sm font-bold text-slate-800">AI Proctoring Enabled</p>
            <p className="text-xs text-slate-500">Enable face detection and noise monitoring</p>
          </div>
          <button onClick={() => toggleSetting('aiEnabled')} className="text-indigo-600">
            {settings.aiEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-slate-400" />}
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <p className="text-sm font-bold text-slate-800">Roadmaps Module</p>
            <p className="text-xs text-slate-500">Enable personalized learning roadmaps</p>
          </div>
          <button onClick={() => toggleSetting('roadmapsEnabled')} className="text-indigo-600">
            {settings.roadmapsEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-slate-400" />}
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <p className="text-sm font-bold text-slate-800">Question Generator</p>
            <p className="text-xs text-slate-500">Enable AI-powered question generation</p>
          </div>
          <button onClick={() => toggleSetting('questionGeneratorEnabled')} className="text-indigo-600">
            {settings.questionGeneratorEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-slate-400" />}
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <p className="text-sm font-bold text-slate-800">Analytics Dashboard</p>
            <p className="text-xs text-slate-500">Enable advanced institution-wide analytics</p>
          </div>
          <button onClick={() => toggleSetting('analyticsEnabled')} className="text-indigo-600">
            {settings.analyticsEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-slate-400" />}
          </button>
        </div>

        <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all">
          <Save size={20} />
          Save Settings
        </button>
      </div>
    </div>
  );
}