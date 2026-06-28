"use client";

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Building2, 
  Key, 
  Users, 
  FileText, 
  ShieldAlert,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { db } from '../../../core/firebase';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { StatCard } from '../../../analytics';

export default function DevDashboard() {
  const [stats, setStats] = useState({
    institutions: 0,
    licenses: 0,
    developers: 0,
    auditLogs: 0
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [instSnap, licSnap, devSnap, auditSnap] = await Promise.all([
          getDocs(collection(db, 'institutions')),
          getDocs(collection(db, 'licenses')),
          getDocs(collection(db, 'developers')),
          getDocs(query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(5)))
        ]);

        setStats({
          institutions: instSnap.size,
          licenses: licSnap.size,
          developers: devSnap.size,
          auditLogs: auditSnap.size
        });

        setRecentLogs(auditSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard title="Total Institutions" value={stats.institutions} icon={Building2} color="bg-indigo-600" description="Registered tenants" />
        <StatCard title="Active Licenses" value={stats.licenses} icon={Key} color="bg-emerald-600" description="Issued enterprise keys" />
        <StatCard title="System Developers" value={stats.developers} icon={Users} color="bg-amber-600" description="Root administrators" />
        <StatCard title="Audit Logs" value={stats.auditLogs} icon={FileText} color="bg-rose-600" description="Security events logged" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
            <Activity size={18} className="text-indigo-400" />
            Recent System Audit Logs
          </h3>
          <div className="space-y-3 font-mono text-xs text-slate-400">
            {recentLogs.length === 0 ? (
              <p className="text-slate-500 italic">No recent audit logs found.</p>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="flex gap-4 border-b border-slate-800/50 pb-2 last:border-0">
                  <span className={log.status === 'success' ? 'text-emerald-400' : 'text-rose-400'}>
                    [{log.status?.toUpperCase()}]
                  </span>
                  <span className="text-slate-500">
                    {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'N/A'}
                  </span>
                  <span>{log.userName} ({log.role}): {log.action} on {log.target}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert size={18} className="text-rose-400" />
              System Health
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Firestore Database</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Operational
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Authentication Service</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Operational
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Cloudinary Storage</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Operational
                </span>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800 text-[10px] text-slate-500 flex items-center gap-1">
            <Clock size={12} />
            Last checked: Just now
          </div>
        </div>
      </div>
    </div>
  );
}

import { Loader2 } from 'lucide-react';