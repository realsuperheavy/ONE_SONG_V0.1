export interface ReviewItem {
  id: string;
  contentType: 'message' | 'profile' | 'request' | 'comment';
  data: any;
  metadata?: Record<string, any>;
}

export interface ModerationResult {
  approved: boolean;
  flags: ModerationFlag[];
  requiresReview: boolean;
  severity?: ModerationSeverity;
  metadata?: Record<string, any>;
}

export interface ModerationFlag {
  type: string;
  description: string;
  severity: ModerationSeverity;
}

export type ModerationSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ModerationAction {
  id: string;
  type: ActionType;
  userId: string;
  reason: string;
  createdBy: string;
  createdAt: number;
  duration?: number;
}

export type ActionType = 'warning' | 'mute' | 'ban';
export type Severity = 'low' | 'medium' | 'high';