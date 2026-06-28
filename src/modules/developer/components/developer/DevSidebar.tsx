"use client";

import React from 'react';
import { 
  Activity, 
  Building2, 
  Users, 
  Layers, 
  Key, 
  Download, 
  Megaphone, 
  Mail, 
  FileText, 
  Sliders, 
  Settings, 
  LogOut,
  Shield,
  Zap
} from 'lucide-react';

export type DevTab = 
  | 'dashboard' 
  | 'institutions' 
  | 'developers' 
  | 'plans' 
  | 'licenses' 
  | 'downloads' 
  | 'announcements' 
  | 'mailqueue' 
  | 'auditlogs' 
  | 'systemconfig' 
  | 'flags' 
  | 'settings';

interface DevSidebarProps {
  activeTab: DevTab;
  setActiveTab: (tab: DevTab) => void;
  developerName: string;
  onLogout: () => void;
}

export default function DevSidebar({ activeTab, setActiveTab, developerName, onLogout }: DevSidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'institutions', label: 'Institutions', icon: Building2 },
    { id: 'developers', label: 'Developers', icon: Users },
    { id: 'plans', label: 'Plans', icon: Layers },
    { id: 'licenses', label: 'Licenses', icon: Key },
    { id: 'downloads', label: 'Downloads', icon: Download },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'mailqueue', label: 'Mail Queue', icon: Mail },
    { id: 'auditlogs', label: 'Audit Logs', icon: FileText },
    { id: 'systemconfig', label: 'System Config', icon: Sliders },
    { id: 'flags', label: 'Feature Flags', icon: Zap },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col sticky top-0 h-screen shrink-0 border-r border-slate-800">
      <div className="p-6 flex-1 flex flex-col overflow-y-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-indigo-600 text-white rounded-xl">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="font-black text-white text-sm uppercase tracking-widest">Root Console</h2>
            <p className="text-[10px] text-slate-500 font-bold">Developer Portal</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {menuItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)} 
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                activeTab === item.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <item.icon size={18} /> 
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6 border-t border-slate-800 bg-slate-900">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-xs text-white">
            {developerName[0] || 'D'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{developerName}</p>
            <p className="text-[10px] text-slate-500 truncate">System Root</p>
          </div>
        </div>
        <button 
          onClick={onLogout} 
          className="w-full flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-rose-400 transition-colors font-medium text-sm"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}