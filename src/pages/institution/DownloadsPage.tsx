"use client";

import React from 'react';
import { Download, Monitor, Apple } from 'lucide-react';

export default function DownloadsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
          <Download size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Downloads</h2>
          <p className="text-slate-500 text-sm">Download the secure browser client for your operating system.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-full mb-4">
            <Monitor size={32} />
          </div>
          <h3 className="font-bold text-slate-900 mb-1">Windows Client</h3>
          <p className="text-xs text-slate-500 mb-6">Version 1.2.0 • Force Update Enabled</p>
          <button className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all">
            Download .msi
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="p-4 bg-slate-100 text-slate-700 rounded-full mb-4">
            <Apple size={32} />
          </div>
          <h3 className="font-bold text-slate-900 mb-1">macOS Client</h3>
          <p className="text-xs text-slate-500 mb-6">Version 1.2.0 • Force Update Enabled</p>
          <button className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all">
            Download .dmg
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-slate-100 text-slate-700 rounded-full mb-4">
            <Download size={32} />
          </div>
          <h3 className="font-bold text-slate-900 mb-1">Linux Client</h3>
          <p className="text-xs text-slate-500 mb-6">Version 1.2.0 • Optional Update</p>
          <button className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all">
            Download .deb
          </button>
        </div>
      </div>
    </div>
  );
}