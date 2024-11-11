export class AppError extends Error {
  constructor(options: {
    code: ErrorCode;
    message: string;
    context?: Record<string, unknown>;
  }) {
    super(options.message);
    this.name = 'AppError';
    this.code = options.code;
    this.context = options.context;
    this.timestamp = new Date();
    this.handled = false;
  }

  code: ErrorCode;
  context?: Record<string, unknown>;
  timestamp: Date;
  handled: boolean;
}

export type ErrorCode = 
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_REQUEST'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'OPERATION_FAILED'; 