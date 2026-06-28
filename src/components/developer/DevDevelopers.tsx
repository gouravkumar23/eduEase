"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  X, 
  Loader2, 
  Check, 
  ShieldAlert,
  Mail,
  User,
  Lock
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { Developer } from '../../repositories/DeveloperRepository';
import { DeveloperService } from '../../services/DeveloperService';

export default function DevDevelopers() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDevelopers();
  }, []);

  const fetchDevelopers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'developers'));
      const data = snap.docs.map(d => d.data() as Developer);
      setDevelopers(data);
    } catch (error) {
      console.error('Error fetching developers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await DeveloperService.createDeveloper(email, password, name);
      alert('Developer account created successfully!');
      resetForm();
      fetchDevelopers();
    } catch (error: any) {
      console.error('Error creating developer:', error);
      alert(error.message || 'Failed to create developer account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (dev: Developer) => {
    const newStatus = dev.role === 'developer' ? 'disabled' : 'developer';
    if (!confirm(`Are you sure you want to ${newStatus === 'disabled' ? 'disable' : 'enable'} ${dev.name}?`)) return;

    try {
      await updateDoc(doc(db, 'developers', dev.uid), {
        role: newStatus
      });
      alert(`Developer status updated to ${newStatus}.`);
      fetchDevelopers();
    } catch (error) {
      console.error('Error updating developer status:', error);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setShowCreateModal(false);
  };

  const filtered = developers.filter(dev => 
    dev.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    dev.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Developers</h2>
          <p className="text-slate-400 text-sm">Manage root developer accounts and access.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
        >
          <Plus size={18} /> Create Developer
        </button>
      </div>

      {/* Search */}
      <div className="relative bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input 
          type="text" 
          placeholder="Search developers by name or email..." 
          className="w-full pl-12 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500">No developers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((dev) => (
                  <tr key={dev.uid} className="hover:bg-slate-800/50">
                    <td className="px-6 py-4 font-bold text-white">{dev.name}</td>
                    <td className="px-6 py-4">{dev.email}</td>
                    <td className="px-6 py-4 capitalize">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                        dev.role === 'developer' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {dev.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleToggleStatus(dev)}
                        className={`p-2 rounded-lg transition-all ${
                          dev.role === 'developer' ? 'text-rose-400 hover:bg-slate-800' : 'text-emerald-400 hover:bg-slate-800'
                        }`}
                        title={dev.role === 'developer' ? 'Disable' : 'Enable'}
                      >
                        <Check size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h3 className="font-bold text-white text-lg">Create Developer Account</h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                    placeholder="Developer Name" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                    placeholder="dev@eduease.com" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={submitting} 
                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}