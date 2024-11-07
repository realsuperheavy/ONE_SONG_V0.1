import { ModerationService } from '../ModerationService';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { Cache } from '@/lib/cache';
import { ref, get, set, update, push } from 'firebase/database';
import { rtdb } from '@/lib/firebase/config';
import type { ContentType, ModerationAction } from '@/types/moderation';

// Mock dependencies
vi.mock('@/lib/firebase/services/analytics');
vi.mock('@/lib/cache');
vi.mock('firebase/database');
vi.mock('@/lib/firebase/config');

describe('ModerationService', () => {
  let moderationService: ModerationService;
  
  const mockContent = {
    id: 'content1',
    type: 'message' as ContentType,
    data: 'Test content'
  };

  const mockAction: Omit<ModerationAction, 'id' | 'createdAt'> = {
    type: 'warning',
    userId: 'user1',
    reason: 'Test reason',
    createdBy: 'mod1'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    moderationService = new ModerationService();
  });

  // ... rest of test code remains the same but with proper types
}); 