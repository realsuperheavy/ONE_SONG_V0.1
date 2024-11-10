export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'warning' | 'error' | 'critical' = 'error',
    public userMessage?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    // Handle known application errors
    console.error(`[${error.code}] ${error.message}`);
    return error.userMessage || 'An error occurred. Please try again.';
  }

  if (error instanceof Error) {
    // Handle standard errors
    console.error(error);
    return 'An unexpected error occurred. Please try again later.';
  }

  // Handle unknown errors
  console.error('Unknown error:', error);
  return 'Something went wrong. Please try again later.';
} 