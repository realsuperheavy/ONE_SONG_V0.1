// Custom error classes
export class AppError extends Error {
  public code: string;
  public context?: any;

  constructor(params: { code: string; message: string; context?: any }) {
    super(params.message);
    this.code = params.code;
    this.context = params.context;
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
  if (error instanceof AppError) {
    return `${error.name} (${error.code}): ${error.message}`;
  }
  return error.message;
}; 