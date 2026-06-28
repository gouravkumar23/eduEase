"use client";

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  FolderTree, 
  Trash2, 
  Copy, 
  Archive, 
  RotateCcw, 
  Eye, 
  Loader2,
  Sparkles,
  X
} from 'lucide-react';
import { useRoadmaps } from '../../roadmaps/hooks/useRoadmaps';
import RoadmapEditor from '../../roadmaps';
import { Roadmap } from '../../repositories/Roadmap';

export default function RoadmapsPage() {
  const {
    roadmaps,
    loading,
    error,
    createRoadmap,
    deleteRoadmap,
    duplicateRoadmap,
    archiveRoadmap,
    restoreRoadmap
  } = useRoadmaps();

  const [activeRoadmapId, setActiveRoadmapId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived' | 'draft'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<Roadmap['visibility']>('institution');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await createRoadmap(title, description, visibility);
      if (created) {
        setShowCreateModal(false);
        setTitle('');
        setDescription('');
        setActiveRoadmapId(created.id);
      }
    } catch (err) {
      alert('Failed to create roadmap');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = roadmaps.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         r.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (activeRoadmapId) {
    return (
      <RoadmapEditor 
        roadmapId={activeRoadmapId} 
        onBack={() => setActiveRoadmapId(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Learning Graph Engine</h2>
          <p className="text-slate-400 text-sm">Design hierarchical learning roadmaps and curriculum structures.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
        >
          <Plus size={18} /> Create Roadmap
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search roadmaps..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
            No roadmaps found. Start by creating one!
          </div>
        ) : (
          filtered.map((roadmap) => (
            <div key={roadmap.id} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between relative group">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => duplicateRoadmap(roadmap.id)}
                  className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg"
                  title="Duplicate"
                >
                  <Copy size={14} />
                </button>
                {roadmap.status !== 'archived' ? (
                  <button 
                    onClick={() => archiveRoadmap(roadmap.id)}
                    className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg"
                    title="Archive"
                  >
                    <Archive size={14} />
                  </button>
                ) : (
                  <button 
                    onClick={() => restoreRoadmap(roadmap.id)}
                    className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg"
                    title="Restore"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
                <button 
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this roadmap and all its nodes?')) {
                      deleteRoadmap(roadmap.id);
                    }
                  }}
                  className="p-1.5 bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    roadmap.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 
                    roadmap.status === 'archived' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {roadmap.status}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded">
                    {roadmap.visibility}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 truncate">{roadmap.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-6">{roadmap.description || 'No description provided.'}</p>

                <div className="space-y-2 text-xs text-slate-500 mb-6">
                  <p><strong>Owner:</strong> {roadmap.ownerName}</p>
                  <p><strong>Nodes:</strong> {roadmap.nodeCount || 0} elements</p>
                  <p><strong>Institution:</strong> {roadmap.institutionId}</p>
                </div>
              </div>

              <button 
                onClick={() => setActiveRoadmapId(roadmap.id)}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-xs text-center hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <FolderTree size={14} />
                Open Editor
              </button>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h3 className="font-bold text-white text-lg">Create Learning Roadmap</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Roadmap Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="e.g. Computer Science Curriculum"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Description</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="Briefly describe the roadmap..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Visibility</label>
                <select 
                  value={visibility} 
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  <option value="institution">Institution Only</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={submitting} 
                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                Create Roadmap
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}