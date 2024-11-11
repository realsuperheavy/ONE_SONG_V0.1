import { z } from 'zod';
import type { WebhookPayload, SongRequest, Event } from '@/types/models';

export class ValidationService {
  private static readonly songRequestSchema = z.object({
    eventId: z.string().min(1),
    userId: z.string().min(1),
    song: z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      artist: z.string().min(1),
      duration: z.number().positive(),
      albumArt: z.string().url().optional(),
      previewUrl: z.string().url().optional()
    }),
    metadata: z.object({
      requestTime: z.number(),
      votes: z.number().default(0),
      tipAmount: z.number().optional()
    })
  });

  private static readonly eventSchema = z.object({
    name: z.string().min(1),
    djId: z.string().min(1),
    status: z.enum(['active', 'ended', 'cancelled', 'scheduled']),
    settings: z.object({
      allowTips: z.boolean(),
      requireApproval: z.boolean(),
      maxQueueSize: z.number().min(1),
      blacklistedGenres: z.array(z.string())
    })
  });

  static validateSongRequest(data: unknown): SongRequest {
    return this.songRequestSchema.parse(data) as SongRequest;
  }

  static validateEvent(data: unknown): Event {
    return this.eventSchema.parse(data) as Event;
  }

  static validateWebhookPayload(data: unknown): WebhookPayload {
    const schema = z.object({
      eventType: z.string(),
      timestamp: z.number(),
      data: z.unknown(),
      signature: z.string()
    });

    return schema.parse(data) as WebhookPayload;
  }
} 