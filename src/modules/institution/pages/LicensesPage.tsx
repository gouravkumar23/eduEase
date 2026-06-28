"use client";

import React from 'react';
import { Key, ShieldCheck, Calendar, Users } from 'lucide-react';

export default function LicensesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
          <Key size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Licenses</h2>
          <p className="text-slate-500 text-sm">Manage your active enterprise licenses and client limits.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-emerald-500" size={24} />
            <div>
              <h3 className="font-bold text-slate-900">Active Enterprise License</h3>
              <p className="text-xs text-slate-500">Key: EDUEASE-ENT-9928-X</p>
            </div>
          </div>
          <span className="text-xs font-bold uppercase px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full">
            Active
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Users size={16} />
              <span className="text-xs font-bold uppercase">Admin Limit</span>
            </div>
            <p className="text-lg font-bold text-slate-800">3 / 5 Admins</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Users size={16} />
              <span className="text-xs font-bold uppercase">Client Limit</span>
            </div>
            <p className="text-lg font-bold text-slate-800">450 / 1000 Students</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Calendar size={16} />
              <span className="text-xs font-bold uppercase">Expiry Date</span>
            </div>
            <p className="text-lg font-bold text-slate-800">Dec 31, 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
}