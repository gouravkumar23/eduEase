"use client";

import React from 'react';
import { Building2, Settings, Key, CreditCard, Download, LogOut, X, Activity, FolderTree } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface InstitutionSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export default function InstitutionSidebar({ isSidebarOpen, setIsSidebarOpen }: InstitutionSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const navItems = [
    { path: '/institution/dashboard', label: 'Dashboard', icon: Activity },
    { path: '/institution/roadmaps', label: 'Roadmaps', icon: FolderTree },
    { path: '/institution/licenses', label: 'Licenses', icon: Key },
    { path: '/institution/subscriptions', label: 'Subscriptions', icon: CreditCard },
    { path: '/institution/downloads', label: 'Downloads', icon: Download },
    { path: '/institution/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Building2 className="text-indigo-400" size={24} />
            <span className="font-bold text-xl">EduEase Enterprise</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400">
            <X size={24} />
          </button>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button 
                key={item.path}
                onClick={() => { navigate(item.path); setIsSidebarOpen(false); }} 
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium relative transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                <item.icon size={20} /> 
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="p-6 border-t border-slate-800 bg-slate-900">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-xs text-white">
            {user?.name?.[0] || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.name || 'Admin'}</p>
            <p className="text-[10px] text-slate-500 truncate">Institution Admin</p>
          </div>
        </div>
        <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors font-medium">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}