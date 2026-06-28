"use client";

import { RoadmapNodeRepository, RoadmapNode, NodeType } from '../repositories/RoadmapNodeRepository';
import { RoadmapRepository } from '../repositories/RoadmapRepository';
import { AuditService } from './AuditService';

export class RoadmapNodeService {
  public static async getNodes(roadmapId: string): Promise<RoadmapNode[]> {
    return await RoadmapNodeRepository.getByRoadmapId(roadmapId);
  }

  public static async createNode(
    node: Omit<RoadmapNode, 'createdAt' | 'updatedAt'>,
    userId: string,
    userName: string,
    userRole: string
  ): Promise<RoadmapNode> {
    // Check for duplicate siblings
    const siblings = await RoadmapNodeRepository.getByRoadmapId(node.roadmapId);
    const hasDuplicate = siblings.some(s => s.parentId === node.parentId && s.title.toLowerCase() === node.title.toLowerCase());
    if (hasDuplicate) {
      throw new Error(`A sibling node with the title "${node.title}" already exists.`);
    }

    await RoadmapNodeRepository.create(node);

    // Update node count in roadmap
    const roadmap = await RoadmapRepository.getById(node.roadmapId);
    if (roadmap) {
      roadmap.nodeCount = (roadmap.nodeCount || 0) + 1;
      await RoadmapRepository.save(roadmap);
    }

    await AuditService.logAction(
      userId,
      userName,
      userRole,
      'Create Roadmap Node',
      `Node ${node.id}`,
      'Learning Graph Engine',
      'success',
      { title: node.title, type: node.nodeType }
    );

    return {
      ...node,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  public static async updateNode(
    node: RoadmapNode,
    userId: string,
    userName: string,
    userRole: string
  ): Promise<void> {
    await RoadmapNodeRepository.save(node);
    await AuditService.logAction(
      userId,
      userName,
      userRole,
      'Update Roadmap Node',
      `Node ${node.id}`,
      'Learning Graph Engine',
      'success',
      { title: node.title }
    );
  }

  public static async deleteNodeCascade(
    nodeId: string,
    roadmapId: string,
    userId: string,
    userName: string,
    userRole: string
  ): Promise<void> {
    const allNodes = await RoadmapNodeRepository.getByRoadmapId(roadmapId);
    
    // Find all descendants recursively
    const toDeleteIds = new Set<string>([nodeId]);
    let addedNew = true;
    
    while (addedNew) {
      addedNew = false;
      allNodes.forEach(n => {
        if (toDeleteIds.has(n.parentId) && !toDeleteIds.has(n.id)) {
          toDeleteIds.add(n.id);
          addedNew = true;
        }
      });
    }

    const idsArray = Array.from(toDeleteIds);
    await RoadmapNodeRepository.deleteBatch(idsArray);

    // Update node count in roadmap
    const roadmap = await RoadmapRepository.getById(roadmapId);
    if (roadmap) {
      roadmap.nodeCount = Math.max(0, (roadmap.nodeCount || 0) - idsArray.length);
      await RoadmapRepository.save(roadmap);
    }

    await AuditService.logAction(
      userId,
      userName,
      userRole,
      'Delete Roadmap Node Cascade',
      `Node ${nodeId}`,
      'Learning Graph Engine',
      'success',
      { deletedCount: idsArray.length }
    );
  }

  public static async reorderNodes(
    nodes: RoadmapNode[],
    userId: string,
    userName: string,
    userRole: string
  ): Promise<void> {
    await RoadmapNodeRepository.saveBatch(nodes);
    if (nodes.length > 0) {
      await AuditService.logAction(
        userId,
        userName,
        userRole,
        'Reorder Roadmap Nodes',
        `Roadmap ${nodes[0].roadmapId}`,
        'Learning Graph Engine',
        'success',
        { count: nodes.length }
      );
    }
  }

  public static async searchNodes(searchTerm: string, institutionId?: string): Promise<RoadmapNode[]> {
    return await RoadmapNodeRepository.searchNodes(searchTerm, institutionId);
  }
}