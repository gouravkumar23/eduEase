"use client";

import { Shield, Activity, CheckCircle, Users, ShieldAlert, User, GraduationCap, Database, Settings, LogOut, X, UserCircle } from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  pendingExamsCount: number;
  pendingRoomsCount: number;
  onLogout: () => void;
}

export default function AdminSidebar({ 
  activeTab, 
  setActiveTab, 
  isSidebarOpen, 
  setIsSidebarOpen, 
  pendingExamsCount, 
  pendingRoomsCount,
  onLogout 
}: AdminSidebarProps) {
  const navItems = [
    { id: 'stats', label: 'Overview', icon: Activity },
    { id: 'approvals', label: 'Exam Approvals', icon: CheckCircle, badge: pendingExamsCount },
    { id: 'rooms', label: 'Room Approvals', icon: Users, badge: pendingRoomsCount },
    { id: 'profile-updates', label: 'Profile Updates', icon: UserCircle },
    { id: 'violations', label: 'Violations', icon: ShieldAlert },
    { id: 'students', label: 'Students', icon: User },
    { id: 'faculty', label: 'Faculty', icon: GraduationCap },
    { id: 'exams', label: 'Assessments', icon: Database },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Shield className="text-indigo-400" size={24} />
            <span className="font-bold text-xl">EduEase</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400">
            <X size={24} />
          </button>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }} 
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium relative transition-colors ${activeTab === item.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <item.icon size={20} /> 
              {item.label}
              {(item.badge || 0) > 0 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
      <div className="p-6 border-t border-slate-800 bg-slate-900">
        <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors font-medium">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}