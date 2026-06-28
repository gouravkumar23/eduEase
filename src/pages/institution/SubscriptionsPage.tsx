"use client";

import React from 'react';
import { CreditCard, CheckCircle2, Calendar } from 'lucide-react';

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
          <CreditCard size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Subscriptions</h2>
          <p className="text-slate-500 text-sm">View your current plan, billing cycle, and renewal details.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-500" size={24} />
            <div>
              <h3 className="font-bold text-slate-900">Yearly Enterprise Plan</h3>
              <p className="text-xs text-slate-500">Billing Cycle: 12-Months</p>
            </div>
          </div>
          <span className="text-xs font-bold uppercase px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full">
            Paid
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Calendar size={16} />
              <span className="text-xs font-bold uppercase">Start Date</span>
            </div>
            <p className="text-lg font-bold text-slate-800">Jan 01, 2025</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Calendar size={16} />
              <span className="text-xs font-bold uppercase">Next Renewal</span>
            </div>
            <p className="text-lg font-bold text-slate-800">Dec 31, 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
}