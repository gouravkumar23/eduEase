"use client";

import React, { useState } from 'react';
import { 
  Undo, 
  Redo, 
  Plus, 
  Download, 
  Upload, 
  FolderTree, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Save,
  Loader2
} from 'lucide-react';
import { useRoadmap } from '../hooks/useRoadmap';
import RoadmapTree from './RoadmapTree';
import NodeEditor from './NodeEditor';
import Breadcrumb from './Breadcrumb';
import { ImportDialog, ExportDialog } from '../../faculty';
import { RoadmapNode, NodeType } from '../repositories/RoadmapNodeRepository';

interface RoadmapEditorProps {
  roadmapId: string;
  onBack: () => void;
}

export default function RoadmapEditor({ roadmapId, onBack }: RoadmapEditorProps) {
  const {
    roadmap,
    nodes,
    loading,
    error,
    undo,
    redo,
    canUndo,
    canRedo,
    createNode,
    updateNode,
    deleteNode,
    reorderNodes
  } = useRoadmap(roadmapId);

  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAddChild = async (parentId: string, type: NodeType, depth: number) => {
    const siblings = nodes.filter(n => n.parentId === parentId);
    const order = siblings.length;
    await createNode(`New ${type}`, parentId, type, depth, order);
  };

  const handleAddRootNode = async () => {
    const rootSiblings = nodes.filter(n => n.parentId === 'root');
    const order = rootSiblings.length;
    await createNode('New Portion', 'root', 'PORTION', 0, order);
  };

  const handleDuplicateNode = async (node: RoadmapNode) => {
    const newId = crypto.randomUUID();
    const duplicated: RoadmapNode = {
      ...node,
      id: newId,
      title: `${node.title} (Copy)`,
      order: nodes.filter(n => n.parentId === node.parentId).length,
      createdAt: null,
      updatedAt: null
    };
    await createNode(duplicated.title, duplicated.parentId, duplicated.nodeType, duplicated.depth, duplicated.order);
  };

  const handleImport = async (importedNodes: any[]) => {
    setSaving(true);
    try {
      const batchNodes = importedNodes.map((n, idx) => ({
        id: n.id || crypto.randomUUID(),
        roadmapId,
        parentId: n.parentId || 'root',
        nodeType: n.nodeType || 'PORTION',
        title: n.title || 'Imported Node',
        description: n.description || '',
        order: n.order !== undefined ? n.order : idx,
        depth: n.depth !== undefined ? n.depth : 0,
        estimatedHours: n.estimatedHours || 1,
        estimatedQuestions: n.estimatedQuestions || 5,
        createdBy: roadmap?.createdBy || '',
        institutionId: roadmap?.institutionId || 'General',
        visibility: roadmap?.visibility || 'institution',
        difficulty: n.difficulty || 'medium',
        color: n.color || '#4f46e5',
        icon: n.icon || 'BookOpen',
        tags: n.tags || [],
        referenceLinks: n.referenceLinks || [],
        notes: n.notes || '',
        status: n.status || 'draft',
        createdAt: null,
        updatedAt: null
      }));
      await reorderNodes([...nodes, ...batchNodes]);
      alert('Nodes imported successfully!');
    } catch (err) {
      alert('Failed to import nodes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Toolbar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-bold text-white truncate max-w-[200px] sm:max-w-md">
              {roadmap?.title}
            </h1>
            <Breadcrumb items={[{ label: roadmap?.title || 'Roadmap' }]} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={undo}
            disabled={!canUndo}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
            title="Undo"
          >
            <Undo size={18} />
          </button>
          <button 
            onClick={redo}
            disabled={!canRedo}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
            title="Redo"
          >
            <Redo size={18} />
          </button>
          <div className="w-px h-6 bg-slate-800 mx-1" />
          <button 
            onClick={() => setShowImport(true)}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
            title="Import"
          >
            <Upload size={18} />
          </button>
          <button 
            onClick={() => setShowExport(true)}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
            title="Export"
          >
            <Download size={18} />
          </button>
          <button 
            onClick={handleAddRootNode}
            className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all"
          >
            <Plus size={14} />
            Add Portion
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tree View Panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {nodes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-20">
              <div className="w-20 h-20 bg-slate-900 rounded-3xl border border-slate-800 flex items-center justify-center mb-6">
                <FolderTree size={36} className="text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Empty Learning Graph</h3>
              <p className="text-slate-500 text-sm mb-6">
                Start building your hierarchical roadmap by adding portions, subjects, lessons, and topics.
              </p>
              <button 
                onClick={handleAddRootNode}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all"
              >
                <Plus size={18} />
                Add First Portion
              </button>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-sm">
              <RoadmapTree 
                nodes={nodes}
                onAddChild={handleAddChild}
                onUpdateNode={updateNode}
                onDeleteNode={deleteNode}
                onDuplicateNode={handleDuplicateNode}
                onSelectNode={setSelectedNode}
                onReorder={reorderNodes}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedNode && (
        <NodeEditor 
          node={selectedNode}
          onSave={updateNode}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {showImport && (
        <ImportDialog 
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      )}

      {showExport && (
        <ExportDialog 
          onClose={() => setShowExport(false)}
          nodes={nodes}
          roadmapTitle={roadmap?.title || 'Roadmap'}
        />
      )}
    </div>
  );
}