import { ref, get, set, update, push } from 'firebase/database';
import { rtdb } from '@/lib/firebase/config';
import { Cache } from '@/lib/cache';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface ContentRule {
  id: string;
  type: 'keyword' | 'pattern' | 'ml';
  value: string | RegExp;
  severity: 'low' | 'medium' | 'high';
  action: 'flag' | 'block' | 'review';
  category: 'profanity' | 'spam' | 'inappropriate' | 'custom';
  metadata?: {
    confidence: number;
    lastUpdated: string;
    createdBy: string;
  };
}

interface ReviewItem {
  id: string;
  contentId: string;
  contentType: 'message' | 'request' | 'profile';
  content: any;
  flags: Flag[];
  status: 'pending' | 'approved' | 'rejected';
  assignedTo?: string;
  createdAt: number;
  updatedAt: number;
}

interface Flag {
  ruleId: string;
  type: ContentRule['type'];
  severity: ContentRule['severity'];
  timestamp: number;
}

interface ModerationAction {
  id: string;
  type: 'warning' | 'mute' | 'ban';
  userId: string;
  reason: string;
  duration?: number;
  createdBy: string;
  createdAt: number;
  expiresAt?: number;
}

// Add type for moderation result
interface ModerationResult {
  approved: boolean;
  flags: Flag[];
  requiresReview: boolean;
  severity?: ContentRule['severity'];
}

export class ModerationService {
  private rules: Map<string, ContentRule>;
  private cache: Cache<ReviewItem>;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.rules = new Map();
    this.cache = new Cache({ maxSize: 1000, ttl: this.CACHE_TTL });
    this.initializeRules();
  }

  private async initializeRules(): Promise<void> {
    try {
      const snapshot = await get(ref(rtdb, 'moderation/rules'));
      const rules = snapshot.val() || {};

      Object.entries(rules).forEach(([id, rule]) => {
        this.rules.set(id, { ...rule as ContentRule, id });
      });

      analyticsService.trackEvent('moderation_rules_loaded', {
        ruleCount: this.rules.size
      });
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'moderation_rules_init'
      });
      throw error;
    }
  }

  async moderateContent(content: {
    id: string;
    type: ReviewItem['contentType'];
    data: any;
  }): Promise<ModerationResult> {
    const flags: Flag[] = [];
    let requiresReview = false;

    try {
      // Check against all rules
      for (const rule of this.rules.values()) {
        const matches = await this.checkRule(rule, content.data);
        if (matches) {
          flags.push({
            ruleId: rule.id,
            type: rule.type,
            severity: rule.severity,
            timestamp: Date.now()
          });

          if (rule.action === 'review') {
            requiresReview = true;
          } else if (rule.action === 'block') {
            return { approved: false, flags, requiresReview: false };
          }
        }
      }

      // Create review item if needed
      if (requiresReview) {
        await this.createReviewItem({
          contentId: content.id,
          contentType: content.type,
          content: content.data,
          flags
        });
      }

      // Track moderation result
      analyticsService.trackEvent('content_moderated', {
        contentType: content.type,
        flagCount: flags.length,
        requiresReview,
        severity: this.getHighestSeverity(flags)
      });

      return {
        approved: flags.length === 0 || (!requiresReview && !flags.some(f => 
          this.rules.get(f.ruleId)?.action === 'block'
        )),
        flags,
        requiresReview,
        severity: this.getHighestSeverity(flags)
      };

    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'content_moderation',
        contentId: content.id,
        contentType: content.type
      });
      throw error;
    }
  }

  private async checkRule(rule: ContentRule, content: any): Promise<boolean> {
    switch (rule.type) {
      case 'keyword':
        return this.checkKeyword(rule.value as string, content);
      case 'pattern':
        return this.checkPattern(rule.value as RegExp, content);
      case 'ml':
        return this.checkMachineLearning(rule.value as string, content);
      default:
        return false;
    }
  }

  private checkKeyword(keyword: string, content: any): boolean {
    const text = this.extractText(content).toLowerCase();
    return text.includes(keyword.toLowerCase());
  }

  private checkPattern(pattern: RegExp, content: any): boolean {
    const text = this.extractText(content);
    return pattern.test(text);
  }

  private async checkMachineLearning(modelId: string, content: any): Promise<boolean> {
    // Implementation would integrate with ML service
    return false;
  }

  private extractText(content: any): string {
    if (typeof content === 'string') return content;
    if (typeof content === 'object') {
      return Object.values(content)
        .map(v => this.extractText(v))
        .join(' ');
    }
    return '';
  }

  async reviewContent(reviewId: string, decision: {
    approved: boolean;
    reason: string;
    moderatorId: string;
  }): Promise<void> {
    try {
      const review = await this.getReviewItem(reviewId);
      if (!review) throw new Error('Review item not found');

      const updates = {
        status: decision.approved ? 'approved' : 'rejected',
        updatedAt: Date.now(),
        moderatorDecision: {
          ...decision,
          timestamp: Date.now()
        }
      };

      // Update review status
      await update(ref(rtdb, `moderation/reviews/${reviewId}`), updates);

      // Update content status
      await this.updateContentStatus(review.contentType, review.contentId, updates.status);

      // Track review action
      analyticsService.trackEvent('content_reviewed', {
        reviewId,
        contentType: review.contentType,
        decision: updates.status,
        moderatorId: decision.moderatorId
      });

    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'content_review',
        reviewId
      });
      throw error;
    }
  }

  async takeAction(action: Omit<ModerationAction, 'id' | 'createdAt'>): Promise<string> {
    try {
      const actionRef = push(ref(rtdb, 'moderation/actions'));
      const actionId = actionRef.key!;

      const actionData: ModerationAction = {
        ...action,
        id: actionId,
        createdAt: Date.now(),
        expiresAt: action.duration ? Date.now() + action.duration : undefined
      };

      await set(actionRef, actionData);

      // Apply action effects
      await this.applyModerationAction(actionData);

      // Track action
      analyticsService.trackEvent('moderation_action_taken', {
        actionId,
        type: action.type,
        userId: action.userId
      });

      return actionId;

    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'moderation_action',
        actionType: action.type,
        userId: action.userId
      });
      throw error;
    }
  }

  private async createReviewItem(data: Omit<ReviewItem, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const reviewRef = push(ref(rtdb, 'moderation/reviews'));
    const reviewId = reviewRef.key!;

    const reviewData: ReviewItem = {
      ...data,
      id: reviewId,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await set(reviewRef, reviewData);
    this.cache.set(reviewId, reviewData);

    return reviewId;
  }

  private async getReviewItem(reviewId: string): Promise<ReviewItem | null> {
    const cached = this.cache.get(reviewId);
    if (cached) return cached;

    const snapshot = await get(ref(rtdb, `moderation/reviews/${reviewId}`));
    const data = snapshot.val();

    if (data) {
      this.cache.set(reviewId, data);
    }

    return data;
  }

  private async updateContentStatus(type: string, id: string, status: string): Promise<void> {
    const updates = {
      moderationStatus: status,
      updatedAt: Date.now()
    };

    await update(ref(rtdb, `${type}s/${id}`), updates);
  }

  private async applyModerationAction(action: ModerationAction): Promise<void> {
    const updates: Record<string, any> = {
      [`users/${action.userId}/moderation`]: {
        status: action.type,
        expiresAt: action.expiresAt,
        reason: action.reason
      }
    };

    if (action.type === 'ban') {
      updates[`users/${action.userId}/status`] = 'banned';
    }

    await update(ref(rtdb), updates);
  }

  private getHighestSeverity(flags: Flag[]): ContentRule['severity'] {
    const severityMap = { low: 0, medium: 1, high: 2 };
    return flags.reduce((highest, flag) => 
      severityMap[flag.severity] > severityMap[highest] ? flag.severity : highest
    , 'low' as ContentRule['severity']);
  }
} 