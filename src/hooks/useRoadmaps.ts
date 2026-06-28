"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { RoadmapService } from '../services/RoadmapService';
import { Roadmap } from '../repositories/RoadmapRepository';

export function useRoadmaps() {
  const { user } = useAuth();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoadmaps = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await RoadmapService.getRoadmaps(user.role === 'admin' || user.role === 'faculty' ? user.branch : undefined);
      setRoadmaps(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch roadmaps');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRoadmaps();
  }, [fetchRoadmaps]);

  const createRoadmap = async (title: string, description: string, visibility: Roadmap['visibility']) => {
    if (!user) return;
    try {
      const newRoadmap = await RoadmapService.createRoadmap(
        title,
        description,
        user.id,
        user.name,
        user.branch || 'General',
        visibility
      );
      setRoadmaps(prev => [newRoadmap, ...prev]);
      return newRoadmap;
    } catch (err: any) {
      setError(err.message || 'Failed to create roadmap');
      throw err;
    }
  };

  const deleteRoadmap = async (id: string) => {
    if (!user) return;
    try {
      await RoadmapService.deleteRoadmap(id, user.id, user.name, user.role);
      setRoadmaps(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete roadmap');
      throw err;
    }
  };

  const duplicateRoadmap = async (id: string) => {
    if (!user) return;
    try {
      const duplicated = await RoadmapService.duplicateRoadmap(id, user.id, user.name, user.role);
      setRoadmaps(prev => [duplicated, ...prev]);
      return duplicated;
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate roadmap');
      throw err;
    }
  };

  const archiveRoadmap = async (id: string) => {
    if (!user) return;
    try {
      const roadmap = roadmaps.find(r => r.id === id);
      if (!roadmap) return;
      const updated = { ...roadmap, status: 'archived' as const };
      await RoadmapService.updateRoadmap(updated, user.id, user.name, user.role);
      setRoadmaps(prev => prev.map(r => r.id === id ? updated : r));
    } catch (err: any) {
      setError(err.message || 'Failed to archive roadmap');
      throw err;
    }
  };

  const restoreRoadmap = async (id: string) => {
    if (!user) return;
    try {
      const roadmap = roadmaps.find(r => r.id === id);
      if (!roadmap) return;
      const updated = { ...roadmap, status: 'active' as const };
      await RoadmapService.updateRoadmap(updated, user.id, user.name, user.role);
      setRoadmaps(prev => prev.map(r => r.id === id ? updated : r));
    } catch (err: any) {
      setError(err.message || 'Failed to restore roadmap');
      throw err;
    }
  };

  return {
    roadmaps,
    loading,
    error,
    fetchRoadmaps,
    createRoadmap,
    deleteRoadmap,
    duplicateRoadmap,
    archiveRoadmap,
    restoreRoadmap
  };
}