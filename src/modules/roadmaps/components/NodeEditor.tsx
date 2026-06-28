"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Sparkles, AlertCircle, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';
import { RoadmapNode } from '../repositories/RoadmapNodeRepository';

interface NodeEditorProps {
  node: RoadmapNode;
  onSave: (updated: RoadmapNode) => Promise<void>;
  onClose: () => void;
}

export default function NodeEditor({ node, onSave, onClose }: NodeEditorProps) {
  const [title, setTitle] = useState(node.title);
  const [description, setDescription] = useState(node.description || '');
  const [estimatedHours, setEstimatedHours] = useState(node.estimatedHours || 1);
  const [estimatedQuestions, setEstimatedQuestions] = useState(node.estimatedQuestions || 5);
  const [difficulty, setDifficulty] = useState(node.difficulty || 'medium');
  const [color, setColor] = useState(node.color || '#4f46e5');
  const [icon, setIcon] = useState(node.icon || 'BookOpen');
  const [tags, setTags] = useState<string[]>(node.tags || []);
  const [newTag, setNewTag] = useState('');
  const [referenceLinks, setReferenceLinks] = useState<string[]>(node.referenceLinks || []);
  const [newLink, setNewLink] = useState('');
  const [notes, setNotes] = useState(node.notes || '');
  const [status, setStatus] = useState(node.status || 'draft');
  const [saving, setSaving] = useState(false);
  const [aiPlaceholder, setAiPlaceholder] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...node,
        title,
        description,
        estimatedHours,
        estimatedQuestions,
        difficulty,
        color,
        icon,
        tags,
        referenceLinks,
        notes,
        status
      });
      onClose();
    } catch (error) {
      alert('Failed to save node properties');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddLink = () => {
    if (newLink.trim() && !referenceLinks.includes(newLink.trim())) {
      setReferenceLinks([...referenceLinks, newLink.trim()]);
      setNewLink('');
    }
  };

  const handleRemoveLink = (link: string) => {
    setReferenceLinks(referenceLinks.filter(l => l !== link));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-3xl border border-slate-800 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div>
            <h3 className="font-bold text-white text-lg">Edit Node Properties</h3>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mt-0.5">{node.nodeType}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-4">
          {aiPlaceholder && (
            <div className="p-4 bg-indigo-950/50 border border-indigo-900 rounded-2xl flex items-start gap-3 text-indigo-400 animate-in fade-in slide-in-from-top-2">
              <Sparkles className="shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-bold">AI Generation Placeholder</p>
                <p className="text-xs opacity-90">AI Generation will be available in Phase 7.</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Description</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Est. Study Hours</label>
              <input 
                type="number" 
                value={estimatedHours} 
                onChange={(e) => setEstimatedHours(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                min={1}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Est. Questions</label>
              <input 
                type="number" 
                value={estimatedQuestions} 
                onChange={(e) => setEstimatedQuestions(parseInt(e.target.value) || 5)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                min={0}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Difficulty</label>
              <select 
                value={difficulty} 
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Status</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Color Theme</label>
              <input 
                type="color" 
                value={color} 
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-10 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer p-1"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Icon</label>
              <select 
                value={icon} 
                onChange={(e) => setIcon(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              >
                <option value="BookOpen">Book</option>
                <option value="FileText">File</option>
                <option value="Award">Award</option>
                <option value="Target">Target</option>
                <option value="Activity">Activity</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Tags</label>
            <div className="flex gap-2 mb-2">
              <input 
                type="text" 
                value={newTag} 
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                placeholder="Add tag..."
              />
              <button 
                type="button" 
                onClick={handleAddTag}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-full text-xs text-slate-300">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="text-rose-400 hover:text-rose-600">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Reference Links</label>
            <div className="flex gap-2 mb-2">
              <input 
                type="url" 
                value={newLink} 
                onChange={(e) => setNewLink(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                placeholder="https://..."
              />
              <button 
                type="button" 
                onClick={handleAddLink}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
            <ul className="space-y-1">
              {referenceLinks.map(link => (
                <li key={link} className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs text-slate-300">
                  <span className="truncate max-w-[300px]">{link}</span>
                  <button type="button" onClick={() => handleRemoveLink(link)} className="text-rose-400 hover:text-rose-600">
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Notes</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              rows={3}
              placeholder="Personal study notes..."
            />
          </div>
        </form>

        <div className="p-6 border-t border-slate-800 flex gap-3 bg-slate-950">
          <button 
            type="button"
            onClick={() => setAiPlaceholder(true)}
            className="flex-1 py-3 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-xl font-bold text-sm hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            AI Generate
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}