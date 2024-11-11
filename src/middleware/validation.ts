import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ValidationService } from '@/lib/validation/ValidationService';
import { z } from 'zod';

export function createValidationMiddleware(schema: z.ZodSchema) {
  return async function validate(request: NextRequest) {
    try {
      const body = await request.json();
      const validated = await schema.parseAsync(body);
      
      // Attach validated data to request
      (request as any).validatedData = validated;
      
      return null; // Continue with request
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation Error',
            details: error.errors
          },
          { status: 400 }
        );
      }
      throw error;
    }
  };
} 