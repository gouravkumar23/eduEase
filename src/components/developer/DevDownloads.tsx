"use client";

import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Plus, 
  X, 
  Loader2, 
  Check, 
  Monitor, 
  Apple, 
  Terminal,
  Edit2,
  Trash2
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Download as DownloadModel, DownloadService } from '../../services/DownloadService';

export default function DevDownloads() {
  const [downloads, setDownloads] = useState<DownloadModel[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDownload, setEditingPlan] = useState<DownloadModel | null>(null);
  
  // Form States
  const [platform, setPlatform] = useState<'Windows' | 'Linux' | 'Mac'>('Windows');
  const [version, setVersion] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [minVersion, setMinVersion] = useState('');
  const [forceUpdate, setForceUpdate] = useState(false);
  const [checksum, setChecksum] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDownloads();
  }, []);

  const fetchDownloads = async () => {
    setLoading(true);
    try {
      const data = await DownloadService.getLatestReleases();
      setDownloads(data);
    } catch (error) {
      console.error('Error fetching downloads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const downloadId = editingDownload ? editingDownload.downloadId : `${platform.toLowerCase()}-${version.replace(/\./g, '-')}`;

    const downloadData: DownloadModel = {
      downloadId,
      platform,
      version,
      releaseNotes,
      minVersion,
      forceUpdate,
      checksum,
      downloadUrl,
      createdAt: editingDownload ? editingDownload.createdAt : new Date().toISOString()
    };

    try {
      await DownloadService.registerRelease(downloadData);
      alert(editingDownload ? 'Release updated successfully!' : 'Release registered successfully!');
      resetForm();
      fetchDownloads();
    } catch (error) {
      console.error('Error saving download:', error);
      alert('Failed to save release.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (dl: DownloadModel) => {
    setEditingPlan(dl);
    setPlatform(dl.platform);
    setVersion(dl.version);
    setReleaseNotes(dl.releaseNotes);
    setMinVersion(dl.minVersion);
    setForceUpdate(dl.forceUpdate);
    setChecksum(dl.checksum);
    setDownloadUrl(dl.downloadUrl);
    setShowCreateModal(true);
  };

  const handleDelete = async (dl: DownloadModel) => {
    if (!confirm(`Are you sure you want to delete the release for ${dl.platform} v${dl.version}?`)) return;

    try {
      await deleteDoc(doc(db, 'downloads', dl.downloadId));
      alert('Release deleted successfully.');
      fetchDownloads();
    } catch (error) {
      console.error('Error deleting release:', error);
    }
  };

  const resetForm = () => {
    setEditingPlan(null);
    setPlatform('Windows');
    setVersion('');
    setReleaseNotes('');
    setMinVersion('');
    setForceUpdate(false);
    setChecksum('');
    setDownloadUrl('');
    setShowCreateModal(false);
  };

  const getPlatformIcon = (plat: string) => {
    switch (plat) {
      case 'Windows': return <Monitor size={24} className="text-blue-400" />;
      case 'Mac': return <Apple size={24} className="text-slate-300" />;
      default: return <Terminal size={24} className="text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Downloads</h2>
          <p className="text-slate-400 text-sm">Manage secure browser client releases.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
        >
          <Plus size={18} /> Register Release
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : downloads.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">No releases registered yet.</div>
        ) : (
          downloads.map((dl) => (
            <div key={dl.downloadId} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between relative group">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(dl)} className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(dl)} className="p-1.5 bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg">
                  <Trash2 size={14} />
                </button>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  {getPlatformIcon(dl.platform)}
                  <div>
                    <h3 className="font-bold text-white">{dl.platform} Client</h3>
                    <p className="text-xs text-slate-500">v{dl.version}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-400 mb-6">
                  <p><strong>Min Version:</strong> {dl.minVersion}</p>
                  <p><strong>Force Update:</strong> {dl.forceUpdate ? 'Yes' : 'No'}</p>
                  <p className="truncate"><strong>Checksum:</strong> {dl.checksum}</p>
                  <p className="line-clamp-3"><strong>Notes:</strong> {dl.releaseNotes}</p>
                </div>
              </div>

              <a 
                href={dl.downloadUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-indigo-600 text-white py-2 rounded-xl font-bold text-xs text-center hover:bg-indigo-700 transition-all"
              >
                Download Package
              </a>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h3 className="font-bold text-white text-lg">
                {editingDownload ? 'Edit Release' : 'Register Release'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Platform</label>
                <select 
                  value={platform} 
                  onChange={(e) => setPlatform(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  <option value="Windows">Windows</option>
                  <option value="Mac">Mac</option>
                  <option value="Linux">Linux</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Version</label>
                <input 
                  type="text" 
                  value={version} 
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="e.g. 1.2.0"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Min Version Required</label>
                <input 
                  type="text" 
                  value={minVersion} 
                  onChange={(e) => setMinVersion(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="e.g. 1.0.0"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Download URL</label>
                <input 
                  type="url" 
                  value={downloadUrl} 
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="https://..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">SHA-256 Checksum</label>
                <input 
                  type="text" 
                  value={checksum} 
                  onChange={(e) => setChecksum(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="Checksum"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Release Notes</label>
                <textarea 
                  value={releaseNotes} 
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="Release notes..."
                  rows={3}
                  required
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase">Force Update</span>
                <input 
                  type="checkbox" 
                  checked={forceUpdate} 
                  onChange={(e) => setForceUpdate(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-800 rounded focus:ring-indigo-500"
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting} 
                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                {editingDownload ? 'Update Release' : 'Register Release'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}