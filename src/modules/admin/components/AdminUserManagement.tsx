"use client";

import { useState } from 'react';
import { Search, Check, UserX, UserCheck, Loader2, Trash2, GraduationCap, Building2, Hash } from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  branch?: string;
  year?: string;
  section?: string;
  rollNumber?: string;
}

interface AdminUserManagementProps {
  users: UserData[];
  role: 'student' | 'faculty';
  onApprove: (id: string) => Promise<void>;
  onToggleStatus: (id: string, status: string) => Promise<void>;
  onDelete: (id: string, name: string) => Promise<void>;
  processingId: string | null;
}

export default function AdminUserManagement({ users, role, onApprove, onToggleStatus, onDelete, processingId }: AdminUserManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(u => {
    if (u.role !== role) return false;
    const s = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(s) || 
      u.email.toLowerCase().includes(s) ||
      (u.rollNumber?.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border shadow-sm">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder={`Search ${role}s by name, email or roll number...`} 
          className="flex-1 outline-none text-sm" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User Details</th>
              {role === 'student' && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Academic Info</th>}
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">{u.name}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                  {u.rollNumber && (
                    <div className="text-[10px] font-bold text-indigo-600 mt-0.5 flex items-center gap-1">
                      <Hash size={10} /> {u.rollNumber}
                    </div>
                  )}
                </td>
                {role === 'student' && (
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                        <Building2 size={14} className="text-slate-400" /> {u.branch || 'N/A'}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                        <GraduationCap size={14} className="text-slate-400" /> Year {u.year || 'N/A'} • Sec {u.section || 'N/A'}
                      </div>
                    </div>
                  </td>
                )}
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                    u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                    u.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    {u.role === 'faculty' && u.status === 'pending' && (
                      <button 
                        onClick={() => onApprove(u.id)} 
                        disabled={processingId === u.id} 
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Approve Faculty"
                      >
                        <Check size={18} />
                      </button>
                    )}
                    <button 
                      onClick={() => onToggleStatus(u.id, u.status)} 
                      disabled={processingId === u.id} 
                      className={`p-2 rounded-lg ${u.status === 'blocked' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'}`}
                      title={u.status === 'blocked' ? 'Unblock User' : 'Block User'}
                    >
                      {processingId === u.id ? <Loader2 size={18} className="animate-spin" /> : u.status === 'blocked' ? <UserCheck size={18} /> : <UserX size={18} />}
                    </button>
                    <button 
                      onClick={() => onDelete(u.id, u.name)}
                      disabled={processingId === u.id}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete User"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}