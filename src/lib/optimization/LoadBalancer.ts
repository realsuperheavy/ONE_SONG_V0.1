import { hash } from '@/utils/hash';

export class LoadBalancer {
  private readonly shardCount: number;
  private readonly nodeMap: Map<number, string>;
  private healthChecks: Map<string, boolean>;

  constructor(shardCount: number = 10) {
    this.shardCount = shardCount;
    this.nodeMap = new Map();
    this.healthChecks = new Map();
    this.initializeNodes();
  }

  private initializeNodes() {
    for (let i = 0; i < this.shardCount; i++) {
      this.nodeMap.set(i, `node-${i}`);
      this.healthChecks.set(`node-${i}`, true);
    }
  }

  getNodeForEvent(eventId: string): string {
    const shard = hash(eventId) % this.shardCount;
    const node = this.nodeMap.get(shard);
    
    if (!node || !this.healthChecks.get(node)) {
      return this.getFallbackNode();
    }
    
    return node;
  }

  private getFallbackNode(): string {
    for (const [node, healthy] of this.healthChecks.entries()) {
      if (healthy) return node;
    }
    throw new Error('No healthy nodes available');
  }

  markNodeUnhealthy(node: string) {
    this.healthChecks.set(node, false);
  }

  markNodeHealthy(node: string) {
    this.healthChecks.set(node, true);
  }
} 