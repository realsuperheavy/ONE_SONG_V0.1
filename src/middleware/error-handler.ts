import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AppError } from '@/lib/error/AppError';
import { logger } from '@/lib/utils/logger';
import { ValidationService } from '@/lib/validation/ValidationService';
import { ZodError } from 'zod';

export async function errorHandler(
  request: NextRequest,
  error: unknown
): Promise<NextResponse> {
  // Log error details
  logger.error('API Error:', {
    path: request.nextUrl.pathname,
    error: error instanceof Error ? error.message : 'Unknown error',
    timestamp: new Date().toISOString()
  });

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        context: error.context
      },
      { status: getStatusCode(error.code) }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation Error',
        details: error.errors
      },
      { status: 400 }
    );
  }

  // Default error response
  return NextResponse.json(
    { error: 'Internal Server Error' },
    { status: 500 }
  );
}

function getStatusCode(errorCode: string): number {
  const statusCodes: Record<string, number> = {
    'NOT_FOUND': 404,
    'UNAUTHORIZED': 401,
    'FORBIDDEN': 403,
    'INVALID_REQUEST': 400,
    'RATE_LIMIT_EXCEEDED': 429
  };
  return statusCodes[errorCode] || 500;
} 