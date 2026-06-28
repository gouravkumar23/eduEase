"use client";

import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  MoreVertical, 
  BookOpen, 
  FileText, 
  Award, 
  Target, 
  Activity,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { RoadmapNode, NodeType } from '../repositories/RoadmapNodeRepository';
import NodeContextMenu from './NodeContextMenu';

interface RoadmapTreeProps {
  nodes: RoadmapNode[];
  onAddChild: (parentId: string, type: NodeType, depth: number) => void;
  onUpdateNode: (node: RoadmapNode) => Promise<void>;
  onDeleteNode: (id: string) => Promise<void>;
  onDuplicateNode: (node: RoadmapNode) => Promise<void>;
  onSelectNode: (node: RoadmapNode) => void;
  onReorder: (reordered: RoadmapNode[]) => Promise<void>;
}

export default function RoadmapTree({
  nodes,
  onAddChild,
  onUpdateNode,
  onDeleteNode,
  onDuplicateNode,
  onSelectNode,
  onReorder
}: RoadmapTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [editingNodeId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleContextMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      nodeId
    });
  };

  const handleInlineRename = async (node: RoadmapNode) => {
    if (editTitle.trim() && editTitle !== node.title) {
      await onUpdateNode({ ...node, title: editTitle.trim() });
    }
    setEditingId(null);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'FileText': return <FileText size={16} />;
      case 'Award': return <Award size={16} />;
      case 'Target': return <Target size={16} />;
      case 'Activity': return <Activity size={16} />;
      default: return <BookOpen size={16} />;
    }
  };

  const getNextNodeType = (currentType: NodeType): NodeType => {
    switch (currentType) {
      case 'ROADMAP': return 'PORTION';
      case 'PORTION': return 'SUBJECT';
      case 'SUBJECT': return 'LESSON';
      case 'LESSON': return 'TOPIC';
      case 'TOPIC': return 'SUBTOPIC';
      default: return 'SUBTOPIC';
    }
  };

  const moveNode = async (node: RoadmapNode, direction: 'up' | 'down') => {
    const siblings = nodes.filter(n => n.parentId === node.parentId).sort((a, b) => a.order - b.order);
    const index = siblings.findIndex(n => n.id === node.id);
    if (direction === 'up' && index > 0) {
      const prev = siblings[index - 1];
      const updated = nodes.map(n => {
        if (n.id === node.id) return { ...n, order: prev.order };
        if (n.id === prev.id) return { ...n, order: node.order };
        return n;
      });
      await onReorder(updated);
    } else if (direction === 'down' && index < siblings.length - 1) {
      const next = siblings[index + 1];
      const updated = nodes.map(n => {
        if (n.id === node.id) return { ...n, order: next.order };
        if (n.id === next.id) return { ...n, order: node.order };
        return n;
      });
      await onReorder(updated);
    }
  };

  const renderNode = (node: RoadmapNode) => {
    const children = nodes.filter(n => n.parentId === node.id).sort((a, b) => a.order - b.order);
    const isExpanded = expanded[node.id];
    const isEditing = editingNodeId === node.id;

    return (
      <div key={node.id} className="select-none">
        <div 
          className="flex items-center justify-between py-2 px-3 hover:bg-slate-800/50 rounded-xl group transition-all cursor-pointer border border-transparent hover:border-slate-800"
          style={{ marginLeft: `${node.depth * 16}px` }}
          onClick={() => onSelectNode(node)}
          onContextMenu={(e) => handleContextMenu(e, node.id)}
        >
          <div className="flex items-center gap-2 min-w-0">
            {children.length > 0 ? (
              <button 
                onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
                className="p-1 text-slate-500 hover:text-white rounded"
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <div className="w-6" />
            )}

            <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${node.color}20`, color: node.color }}>
              {getIcon(node.icon)}
            </div>

            {isEditing ? (
              <input 
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={() => handleInlineRename(node)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInlineRename(node);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-sm font-medium text-slate-200 truncate max-w-[200px] sm:max-w-md">
                {node.title}
              </span>
            )}

            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-slate-800 text-slate-500 rounded shrink-0">
              {node.nodeType}
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {node.nodeType !== 'SUBTOPIC' && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild(node.id, getNextNodeType(node.nodeType), node.depth + 1);
                }}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                title="Add Child Node"
              >
                <Plus size={14} />
              </button>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
              }}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
            >
              <MoreVertical size={14} />
            </button>
          </div>
        </div>

        {isExpanded && children.length > 0 && (
          <div className="mt-1 space-y-1">
            {children.map(child => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  const rootNodes = nodes.filter(n => n.parentId === 'root').sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-1 relative">
      {rootNodes.map(node => renderNode(node))}

      {contextMenu && (
        <NodeContextMenu 
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onRename={() => {
            const node = nodes.find(n => n.id === contextMenu.nodeId);
            if (node) {
              setEditingId(node.id);
              setEditTitle(node.title);
            }
          }}
          onDelete={() => {
            if (confirm('Are you sure you want to delete this node and all its descendants?')) {
              onDeleteNode(contextMenu.nodeId);
            }
          }}
          onDuplicate={() => {
            const node = nodes.find(n => n.id === contextMenu.nodeId);
            if (node) onDuplicateNode(node);
          }}
          onMoveUp={() => {
            const node = nodes.find(n => n.id === contextMenu.nodeId);
            if (node) moveNode(node, 'up');
          }}
          onMoveDown={() => {
            const node = nodes.find(n => n.id === contextMenu.nodeId);
            if (node) moveNode(node, 'down');
          }}
          onAddChild={
            nodes.find(n => n.id === contextMenu.nodeId)?.nodeType !== 'SUBTOPIC' 
              ? () => {
                  const node = nodes.find(n => n.id === contextMenu.nodeId);
                  if (node) onAddChild(node.id, getNextNodeType(node.nodeType), node.depth + 1);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}