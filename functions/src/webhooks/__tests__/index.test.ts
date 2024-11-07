import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions-test';
import axios from 'axios';
import { sendWebhook, cleanupWebhookLogs } from '../index';

// Initialize test environment
const testEnv = functions();
const mockAdmin = {
  firestore: () => ({
    collection: jest.fn(() => ({
      add: jest.fn(),
      where: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn()
        }))
      })),
      doc: jest.fn(() => ({
        delete: jest.fn()
      }))
    }))
  })
};

// Mock dependencies
jest.mock('firebase-admin', () => ({
  firestore: {
    FieldValue: {
      serverTimestamp: jest.fn()
    }
  },
  initializeApp: jest.fn()
}));
jest.mock('axios');

describe('Webhook Functions', () => {
  let mockContext;
  let mockWebhookConfig;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock auth context
    mockContext = {
      auth: {
        uid: 'test-user'
      }
    };

    // Mock webhook config
    mockWebhookConfig = {
      empty: false,
      docs: [{
        id: 'webhook-1',
        data: () => ({
          url: 'https://test.com/webhook',
          secret: 'test-secret',
          timeout: 5000
        })
      }]
    };

    // Mock Firestore responses
    (mockAdmin.firestore().collection().where().limit().get as jest.Mock)
      .mockResolvedValue(mockWebhookConfig);
  });

  describe('sendWebhook', () => {
    const mockPayload = {
      eventType: 'test-event',
      data: { test: true },
      timestamp: Date.now(),
      signature: 'valid-signature'
    };

    it('validates authentication', async () => {
      const unauthenticatedContext = { auth: null };
      const wrappedFunction = testEnv.wrap(sendWebhook);

      await expect(wrappedFunction({ 
        url: 'https://test.com/webhook',
        payload: mockPayload
      }, unauthenticatedContext)).rejects.toThrow('unauthenticated');
    });

    it('validates webhook configuration', async () => {
      const emptyConfig = { ...mockWebhookConfig, empty: true };
      (mockAdmin.firestore().collection().where().limit().get as jest.Mock)
        .mockResolvedValueOnce(emptyConfig);

      const wrappedFunction = testEnv.wrap(sendWebhook);

      await expect(wrappedFunction({
        url: 'https://test.com/webhook',
        payload: mockPayload
      }, mockContext)).rejects.toThrow('not-found');
    });

    it('validates webhook signature', async () => {
      const wrappedFunction = testEnv.wrap(sendWebhook);
      const invalidPayload = {
        ...mockPayload,
        signature: 'invalid-signature'
      };

      await expect(wrappedFunction({
        url: 'https://test.com/webhook',
        payload: invalidPayload
      }, mockContext)).rejects.toThrow('permission-denied');
    });

    it('successfully delivers webhook', async () => {
      const wrappedFunction = testEnv.wrap(sendWebhook);
      (axios as jest.Mock).mockResolvedValueOnce({
        status: 200,
        headers: {
          'x-response-time': '50ms'
        }
      });

      const result = await wrappedFunction({
        url: 'https://test.com/webhook',
        payload: mockPayload
      }, mockContext);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(mockAdmin.firestore().collection().add).toHaveBeenCalledWith(
        expect.objectContaining({
          webhookId: 'webhook-1',
          success: true
        })
      );
    });

    it('handles webhook delivery failure', async () => {
      const wrappedFunction = testEnv.wrap(sendWebhook);
      const error = new Error('Delivery failed');
      (axios as jest.Mock).mockRejectedValueOnce(error);

      await expect(wrappedFunction({
        url: 'https://test.com/webhook',
        payload: mockPayload
      }, mockContext)).rejects.toThrow('unavailable');

      expect(mockAdmin.firestore().collection().add).toHaveBeenCalledWith(
        expect.objectContaining({
          webhookId: 'webhook-1',
          success: false,
          error: error.message
        })
      );
    });

    it('respects webhook timeout', async () => {
      const wrappedFunction = testEnv.wrap(sendWebhook);
      
      await wrappedFunction({
        url: 'https://test.com/webhook',
        payload: mockPayload,
        timeout: 1000
      }, mockContext);

      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 1000
        })
      );
    });
  });

  describe('cleanupWebhookLogs', () => {
    it('deletes old webhook logs', async () => {
      const wrappedFunction = testEnv.wrap(cleanupWebhookLogs);
      const mockSnapshot = {
        size: 5,
        docs: Array(5).fill({
          ref: {
            delete: jest.fn()
          }
        })
      };

      (mockAdmin.firestore().collection().where().get as jest.Mock)
        .mockResolvedValueOnce(mockSnapshot);

      await wrappedFunction();

      mockSnapshot.docs.forEach(doc => {
        expect(doc.ref.delete).toHaveBeenCalled();
      });
    });

    it('handles cleanup errors gracefully', async () => {
      const wrappedFunction = testEnv.wrap(cleanupWebhookLogs);
      const error = new Error('Cleanup failed');
      
      (mockAdmin.firestore().collection().where().get as jest.Mock)
        .mockRejectedValueOnce(error);

      await wrappedFunction();

      // Should not throw, but log error
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Webhook log cleanup failed'),
        expect.any(Error)
      );
    });
  });

  afterAll(() => {
    testEnv.cleanup();
  });
}); 