import { describe, it, expect, beforeEach } from 'vitest';
import { LoadBalancer } from '../LoadBalancer';

describe('LoadBalancer', () => {
  let loadBalancer: LoadBalancer;
  const shardCount = 10;

  beforeEach(() => {
    loadBalancer = new LoadBalancer(shardCount);
  });

  describe('Node Distribution', () => {
    it('should consistently map same eventId to same node', () => {
      const eventId = 'test-event-123';
      const node1 = loadBalancer.getNodeForEvent(eventId);
      const node2 = loadBalancer.getNodeForEvent(eventId);
      
      expect(node1).toBe(node2);
    });

    it('should distribute load across available nodes', () => {
      const nodeMap = new Map<string, number>();
      const iterations = 1000;

      // Generate many events and count distribution
      for (let i = 0; i < iterations; i++) {
        const eventId = `event-${i}`;
        const node = loadBalancer.getNodeForEvent(eventId);
        nodeMap.set(node, (nodeMap.get(node) || 0) + 1);
      }

      // Check distribution
      const counts = Array.from(nodeMap.values());
      const average = iterations / shardCount;
      const variance = Math.max(...counts) - Math.min(...counts);
      
      // Should be reasonably distributed (within 20% of average)
      expect(variance).toBeLessThan(average * 0.2);
    });
  });

  describe('Node Health Management', () => {
    it('should fallback to healthy node when primary is unhealthy', () => {
      const eventId = 'test-event-123';
      const primaryNode = loadBalancer.getNodeForEvent(eventId);
      
      loadBalancer.markNodeUnhealthy(primaryNode);
      const fallbackNode = loadBalancer.getNodeForEvent(eventId);
      
      expect(fallbackNode).not.toBe(primaryNode);
    });

    it('should return to primary node when health restored', () => {
      const eventId = 'test-event-123';
      const primaryNode = loadBalancer.getNodeForEvent(eventId);
      
      loadBalancer.markNodeUnhealthy(primaryNode);
      const fallbackNode = loadBalancer.getNodeForEvent(eventId);
      
      loadBalancer.markNodeHealthy(primaryNode);
      const restoredNode = loadBalancer.getNodeForEvent(eventId);
      
      expect(restoredNode).toBe(primaryNode);
    });

    it('should throw error when no healthy nodes available', () => {
      // Mark all nodes as unhealthy
      for (let i = 0; i < shardCount; i++) {
        loadBalancer.markNodeUnhealthy(`node-${i}`);
      }

      expect(() => {
        loadBalancer.getNodeForEvent('test-event');
      }).toThrow('No healthy nodes available');
    });
  });
}); 