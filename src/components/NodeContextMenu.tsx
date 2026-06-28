"use client";

import React from 'react';
import { Edit2, Trash2, Copy, ArrowUp, ArrowDown, Plus } from 'lucide-react';

interface NodeContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onAddChild?: () => void;
}

export default function NodeContextMenu({
  x,
  y,
  onClose,
  onRename,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onAddChild
}: NodeContextMenuProps) {
  React.useEffect(() => {
    const handleOutsideClick = () => onClose();
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [onClose]);

  return (
    <div 
      className="fixed z-[150] bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1.5 min-w-[160px] text-xs text-slate-300 animate-in fade-in zoom-in-95 duration-100"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      {onAddChild && (
        <button 
          onClick={() => { onAddChild(); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-800 hover:text-white text-left"
        >
          <Plus size={14} className="text-indigo-400" />
          Add Child Node
        </button>
      )}
      <button 
        onClick={() => { onRename(); onClose(); }}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-800 hover:text-white text-left"
      >
        <Edit2 size={14} className="text-indigo-400" />
        Rename Node
      </button>
      <button 
        onClick={() => { onDuplicate(); onClose(); }}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-800 hover:text-white text-left"
      >
        <Copy size={14} className="text-indigo-400" />
        Duplicate Node
      </button>
      {onMoveUp && (
        <button 
          onClick={() => { onMoveUp(); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-800 hover:text-white text-left"
        >
          <ArrowUp size={14} className="text-indigo-400" />
          Move Up
        </button>
      )}
      {onMoveDown && (
        <button 
          onClick={() => { onMoveDown(); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-800 hover:text-white text-left"
        >
          <ArrowDown size={14} className="text-indigo-400" />
          Move Down
        </button>
      )}
      <div className="border-t border-slate-800 my-1" />
      <button 
        onClick={() => { onDelete(); onClose(); }}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-rose-950/50 hover:text-rose-400 text-left text-rose-400"
      >
        <Trash2 size={14} />
        Delete Node
      </button>
    </div>
  );
}