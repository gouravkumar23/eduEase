"use client";

import { RoadmapRepository, Roadmap } from '../repositories/RoadmapRepository';
import { RoadmapNodeRepository, RoadmapNode } from '../repositories/RoadmapNodeRepository';
import { AuditService } from './AuditService';

export class RoadmapService {
  public static async getRoadmap(id: string): Promise<Roadmap | null> {
    return await RoadmapRepository.getById(id);
  }

  public static async createRoadmap(
    title: string,
    description: string,
    createdBy: string,
    ownerName: string,
    institutionId: string,
    visibility: Roadmap['visibility'] = 'institution'
  ): Promise<Roadmap> {
    const id = crypto.randomUUID();
    const roadmap: Roadmap = {
      id,
      title,
      description,
      institutionId,
      createdBy,
      ownerName,
      visibility,
      status: 'draft',
      nodeCount: 0,
      createdAt: null,
      updatedAt: null
    };

    await RoadmapRepository.create(roadmap);
    await AuditService.logAction(
      createdBy,
      ownerName,
      'faculty',
      'Create Roadmap',
      `Roadmap ${id}`,
      'Learning Graph Engine',
      'success',
      { title }
    );

    return roadmap;
  }

  public static async updateRoadmap(
    roadmap: Roadmap,
    userId: string,
    userName: string,
    userRole: string
  ): Promise<void> {
    await RoadmapRepository.save(roadmap);
    await AuditService.logAction(
      userId,
      userName,
      userRole,
      'Update Roadmap',
      `Roadmap ${roadmap.id}`,
      'Learning Graph Engine',
      'success',
      { title: roadmap.title }
    );
  }

  public static async deleteRoadmap(
    id: string,
    userId: string,
    userName: string,
    userRole: string
  ): Promise<void> {
    // Fetch all nodes to delete them as well
    const nodes = await RoadmapNodeRepository.getByRoadmapId(id);
    const nodeIds = nodes.map(n => n.id);
    
    if (nodeIds.length > 0) {
      await RoadmapNodeRepository.deleteBatch(nodeIds);
    }
    
    await RoadmapRepository.delete(id);
    await AuditService.logAction(
      userId,
      userName,
      userRole,
      'Delete Roadmap',
      `Roadmap ${id}`,
      'Learning Graph Engine',
      'success',
      { nodeCountDeleted: nodeIds.length }
    );
  }

  public static async duplicateRoadmap(
    id: string,
    userId: string,
    userName: string,
    userRole: string
  ): Promise<Roadmap> {
    const original = await RoadmapRepository.getById(id);
    if (!original) throw new Error('Original roadmap not found');

    const newId = crypto.randomUUID();
    const duplicated: Roadmap = {
      ...original,
      id: newId,
      title: `${original.title} (Copy)`,
      status: 'draft',
      createdAt: null,
      updatedAt: null
    };

    await RoadmapRepository.create(duplicated);

    // Duplicate all nodes
    const originalNodes = await RoadmapNodeRepository.getByRoadmapId(id);
    const idMap: Record<string, string> = { 'root': 'root' };

    // First pass: generate new IDs
    originalNodes.forEach(node => {
      idMap[node.id] = crypto.randomUUID();
    });

    const duplicatedNodes: RoadmapNode[] = originalNodes.map(node => ({
      ...node,
      id: idMap[node.id],
      roadmapId: newId,
      parentId: idMap[node.parentId] || 'root',
      createdAt: null,
      updatedAt: null
    }));

    if (duplicatedNodes.length > 0) {
      await RoadmapNodeRepository.saveBatch(duplicatedNodes);
    }

    await AuditService.logAction(
      userId,
      userName,
      userRole,
      'Duplicate Roadmap',
      `Roadmap ${id} to ${newId}`,
      'Learning Graph Engine',
      'success',
      { originalTitle: original.title }
    );

    return duplicated;
  }

  public static async getRoadmaps(institutionId?: string): Promise<Roadmap[]> {
    return await RoadmapRepository.getAll(institutionId);
  }
}