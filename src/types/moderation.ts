export type ContentType = 'message' | 'profile' | 'request';
export type ActionType = 'warning' | 'mute' | 'ban';
export type Severity = 'low' | 'medium' | 'high';

export interface ModerationAction {
  id: string;
  type: ActionType;
  userId: string;
  reason: string;
  createdBy: string;
  createdAt: number;
  duration?: number;
}

export interface ContentFlag {
  type: string;
  severity: Severity;
  description: string;
}

export interface ModerationResult {
  approved: boolean;
  requiresReview: boolean;
  flags: ContentFlag[];
} 