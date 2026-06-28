"use client";

import React from 'react';
import { Users, Key, CreditCard, Activity, ShieldAlert, BookOpen } from 'lucide-react';
import { StatCard } from '../../analytics';

export default function InstitutionDashboard() {
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Institution Overview</h2>
        <p className="text-indigo-100 opacity-90 text-sm sm:text-base">Manage your enterprise settings, licenses, and subscriptions.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard title="Total Admins" value="3 / 5" icon={Users} color="bg-indigo-600" description="Active admin accounts" />
        <StatCard title="Active Licenses" value="1" icon={Key} color="bg-emerald-600" description="Valid enterprise license" />
        <StatCard title="Current Plan" value="Yearly Enterprise" icon={CreditCard} color="bg-amber-600" description="Renews on Dec 31, 2025" />
        <StatCard title="System Status" value="Healthy" icon={Activity} color="bg-rose-600" description="All services operational" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BookOpen size={20} className="text-indigo-600" />
            Recent Activity Logs
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-800">License Validated Successfully</p>
                <p className="text-xs text-slate-500">System verified activation key</p>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Just now</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-800">Subscription Status Checked</p>
                <p className="text-xs text-slate-500">Yearly Enterprise plan active</p>
              </div>
              <span className="text-[10px] font-bold text-slate-400">10 mins ago</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-800">Admin Account Created</p>
                <p className="text-xs text-slate-500">New administrator added to tenant</p>
              </div>
              <span className="text-[10px] font-bold text-slate-400">1 hour ago</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ShieldAlert size={20} className="text-rose-500" />
            Security Alerts
          </h3>
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs leading-relaxed">
            No security alerts detected. Your enterprise tenant is fully secured and compliant with global proctoring standards.
          </div>
        </div>
      </div>
    </div>
  );
}