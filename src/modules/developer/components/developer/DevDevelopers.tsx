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
import { db } from '../../../core/firebase';
import { collection, query, getDocs, orderBy, doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Developer } from '../../repositories/DeveloperRepository';

interface DeveloperWithAuth extends Developer {
  isAdmin: boolean;
}

export default function DevDevelopers() {
  const [developers, setDevelopers] = useState<DeveloperWithAuth[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDev, setNewDev] = useState({ email: '', name: '', password: '' });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDevelopers();
  }, []);

  const fetchDevelopers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'developers'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ ...d.data(), uid: d.id } as DeveloperWithAuth));
      setDevelopers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeveloper = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError('');
    try {
      // In a real app, this would call an API to create the user in Firebase Auth
      // and then save the developer record. For now, we just save the record.
      const uid = crypto.randomUUID();
      await setDoc(doc(db, 'developers', uid), {
        uid,
        email: newDev.email.toLowerCase().trim(),
        name: newDev.name,
        role: 'developer',
        createdAt: serverTimestamp()
      });
      
      setShowAddModal(false);
      setNewDev({ email: '', name: '', password: '' });
      fetchDevelopers();
    } catch (err: any) {
      setError(err.message || 'Failed to add developer');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleAdmin = async (uid: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'developers', uid), {
        isAdmin: !currentStatus
      });
      fetchDevelopers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (uid: string) => {
    if (!confirm('Are you sure you want to remove this developer?')) return;
    try {
      await deleteDoc(doc(db, 'developers', uid));
      fetchDevelopers();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = developers.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Developer Management</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Developer
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search developers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-4 text-slate-300 font-medium">Developer</th>
                <th className="text-left p-4 text-slate-300 font-medium">Role</th>
                <th className="text-left p-4 text-slate-300 font-medium">Status</th>
                <th className="text-right p-4 text-slate-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(dev => (
                <tr key={dev.uid} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                        {dev.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-white font-medium">{dev.name}</div>
                        <div className="text-slate-400 text-sm">{dev.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-sm">
                      {dev.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleAdmin(dev.uid, dev.isAdmin || false)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors ${
                        dev.isAdmin 
                          ? 'bg-amber-500/20 text-amber-300' 
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      <ShieldAlert className="w-3 h-3" />
                      {dev.isAdmin ? 'Admin' : 'Standard'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(dev.uid)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Add New Developer</h3>
            <form onSubmit={handleAddDeveloper} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={newDev.name}
                    onChange={e => setNewDev({ ...newDev, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={newDev.email}
                    onChange={e => setNewDev({ ...newDev, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={newDev.password}
                    onChange={e => setNewDev({ ...newDev, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              {error && (
                <div className="text-red-400 text-sm">{error}</div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {adding && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add Developer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
