"use client";

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Search, 
  Loader2, 
  RefreshCw, 
  XCircle, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import { db } from '../../../core/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, limit } from 'firebase/firestore';

interface MailItem {
  id: string;
  to: string;
  subject: string;
  body: string;
  type: string;
  status: 'pending' | 'failed' | 'completed';
  createdAt: any;
}

export default function DevMailQueue() {
  const [queue, setQueue] = useState<MailType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'mailQueue'), orderBy('createdAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      setQueue(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    } catch (error) {
      console.error('Error fetching mail queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueue = fetchData;

  const handleRetry = async (id: string) => {
    setProcessingId(id);
    try {
      await updateDoc(doc(db, 'mailQueue', id), {
        status: 'pending',
        updatedAt: new Date().toISOString()
      });
      alert('Mail queued for retry.');
      fetchQueue();
    } catch (error) {
      console.error('Error retrying mail:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this queued mail?')) return;
    setProcessingId(id);
    try {
      await deleteDoc(doc(db, 'mailQueue', id));
      alert('Mail canceled and removed from queue.');
      fetchQueue();
    } catch (error) {
      console.error('Error canceling mail:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = queue.filter(item => {
    const matchesSearch = item.to.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Mail Queue</h2>
          <p className="text-slate-400 text-sm">Monitor and manage system email dispatches.</p>
        </div>
        <button 
          onClick={fetchQueue}
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-700 transition-all"
        >
          <RefreshCw size={16} /> Refresh Queue
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by recipient or subject..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500">No mail items in queue.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Recipient</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/50">
                    <td className="px-6 py-4 font-bold text-white">{item.to}</td>
                    <td className="px-6 py-4 truncate max-w-xs">{item.subject}</td>
                    <td className="px-6 py-4 capitalize">{item.type?.replace('_', ' ')}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full flex items-center gap-1 w-fit ${
                        item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        item.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {item.status === 'completed' && <CheckCircle2 size={12} />}
                        {item.status === 'failed' && <XCircle size={12} />}
                        {item.status === 'pending' && <Clock size={12} />}
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.status === 'failed' && (
                          <button 
                            onClick={() => handleRetry(item)}
                            disabled={processingId === item.id}
                            className="p-2 text-emerald-400 hover:bg-slate-800 rounded-lg transition-all"
                            title="Retry"
                          >
                            <RefreshCw size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleCancel(item.id)}
                          disabled={processingId === item.id}
                          className="p-2 text-rose-400 hover:bg-slate-800 rounded-lg transition-all"
                          title="Cancel"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { MailType } from '../../services/MailQueueService';