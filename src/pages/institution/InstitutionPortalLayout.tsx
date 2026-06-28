"use client";

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import InstitutionSidebar from '../../components/InstitutionSidebar';
import { Menu } from 'lucide-react';

export default function InstitutionPortalLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <InstitutionSidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 sm:px-8 top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-bold text-slate-800">Institution Management Console</h1>
          </div>
        </header>

        <div className="p-4 sm:p-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}