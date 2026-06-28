"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../modules/auth';
import { RoadmapService } from '../services/RoadmapService';
import { RoadmapNodeService } from '../services/RoadmapNodeService';
import { Roadmap } from '../repositories/RoadmapRepository';
import { RoadmapNode, NodeType } from '../repositories/RoadmapNodeRepository';

export function useRoadmap(roadmapId: string) {
  const { user } = useAuth();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Undo/Redo History Stack
  const historyRef = useRef<RoadmapNode[][]>([]);
  const redoRef = useRef<RoadmapNode[][]>([]);

  const fetchRoadmapAndNodes = useCallback(async () => {
    if (!roadmapId) return;
    setLoading(true);
    setError(null);
    try {
      const rData = await RoadmapService.getRoadmap(roadmapId);
      const nData = await RoadmapNodeService.getNodes(roadmapId);
      setRoadmap(rData);
      setNodes(nData);
      historyRef.current = [nData];
      redoRef.current = [];
    } catch (err: any) {
      setError(err.message || 'Failed to load roadmap details');
    } finally {
      setLoading(false);
    }
  }, [roadmapId]);

  useEffect(() => {
    fetchRoadmapAndNodes();
  }, [fetchRoadmapAndNodes]);

  const pushToHistory = (newNodes: RoadmapNode[]) => {
    historyRef.current.push(newNodes);
    redoRef.current = [];
  };

  const undo = async () => {
    if (historyRef.current.length <= 1 || !user) return;
    const current = historyRef.current.pop()!;
    redoRef.current.push(current);
    const previous = historyRef.current[historyRef.current.length - 1];
    setNodes(previous);
    await RoadmapNodeService.reorderNodes(previous, user.id, user.name, user.role);
  };

  const redo = async () => {
    if (redoRef.current.length === 0 || !user) return;
    const next = redoRef.current.pop()!;
    historyRef.current.push(next);
    setNodes(next);
    await RoadmapNodeService.reorderNodes(next, user.id, user.name, user.role);
  };

  const createNode = async (
    title: string,
    parentId: string,
    nodeType: NodeType,
    depth: number,
    order: number
  ) => {
    if (!user) return;
    try {
      const newNode: Omit<RoadmapNode, 'createdAt' | 'updatedAt'> = {
        id: crypto.randomUUID(),
        roadmapId,
        parentId,
        nodeType,
        title,
        description: '',
        order,
        depth,
        estimatedHours: 1,
        estimatedQuestions: 5,
        createdBy: user.id,
        institutionId: user.branch || 'General',
        visibility: 'institution',
        difficulty: 'medium',
        color: '#4f46e5',
        icon: 'BookOpen',
        tags: [],
        referenceLinks: [],
        notes: '',
        status: 'draft'
      };

      const created = await RoadmapNodeService.createNode(newNode, user.id, user.name, user.role);
      const updatedNodes = [...nodes, created];
      setNodes(updatedNodes);
      pushToHistory(updatedNodes);
      return created;
    } catch (err: any) {
      setError(err.message || 'Failed to create node');
      throw err;
    }
  };

  const updateNode = async (node: RoadmapNode) => {
    if (!user) return;
    try {
      await RoadmapNodeService.updateNode(node, user.id, user.name, user.role);
      const updatedNodes = nodes.map(n => n.id === node.id ? node : n);
      setNodes(updatedNodes);
      pushToHistory(updatedNodes);
    } catch (err: any) {
      setError(err.message || 'Failed to update node');
      throw err;
    }
  };

  const deleteNode = async (nodeId: string) => {
    if (!user) return;
    try {
      await RoadmapNodeService.deleteNodeCascade(nodeId, roadmapId, user.id, user.name, user.role);
      // Filter out deleted node and all its descendants locally
      const toDeleteIds = new Set<string>([nodeId]);
      let addedNew = true;
      while (addedNew) {
        addedNew = false;
        nodes.forEach(n => {
          if (toDeleteIds.has(n.parentId) && !toDeleteIds.has(n.id)) {
            toDeleteIds.add(n.id);
            addedNew = true;
          }
        });
      }
      const updatedNodes = nodes.filter(n => !toDeleteIds.has(n.id));
      setNodes(updatedNodes);
      pushToHistory(updatedNodes);
    } catch (err: any) {
      setError(err.message || 'Failed to delete node');
      throw err;
    }
  };

  const reorderNodes = async (reordered: RoadmapNode[]) => {
    if (!user) return;
    try {
      setNodes(reordered);
      await RoadmapNodeService.reorderNodes(reordered, user.id, user.name, user.role);
      pushToHistory(reordered);
    } catch (err: any) {
      setError(err.message || 'Failed to reorder nodes');
      throw err;
    }
  };

  return {
    roadmap,
    nodes,
    loading,
    error,
    undo,
    redo,
    canUndo: historyRef.current.length > 1,
    canRedo: redoRef.current.length > 0,
    createNode,
    updateNode,
    deleteNode,
    reorderNodes,
    refresh: fetchRoadmapAndNodes
  };
}
