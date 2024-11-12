// Custom error classes
export class PlaybackError extends Error {
  constructor(message: string, public code: string, public metadata?: Record<string, any>) {
    super(message);
    this.name = 'PlaybackError';
  }
}

export class QueueError extends Error {
  constructor(message: string, public code: string, public metadata?: Record<string, any>) {
    super(message);
    this.name = 'QueueError';
  }
}

// Error recovery strategies
export const errorRecoveryStrategies = {
  playback: {
    retry: async (fn: () => Promise<void>, maxAttempts = 3): Promise<void> => {
      let attempts = 0;
      while (attempts < maxAttempts) {
        try {
          await fn();
          return;
        } catch (error) {
          attempts++;
          if (attempts === maxAttempts) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
    }
  }
};

// Error boundary utilities
export const getErrorMessage = (error: Error): string => {
  if (error instanceof PlaybackError || error instanceof QueueError) {
    return `${error.name} (${error.code}): ${error.message}`;
  }
  return error.message;
}; 