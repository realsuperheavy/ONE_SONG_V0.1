import { adminAuth } from '../admin';
import { AppError } from '@/lib/error/AppError';

export class RBACService {
  async assignRole(userId: string, role: 'dj' | 'attendee' | 'admin') {
    try {
      await adminAuth.setCustomUserClaims(userId, { role });
    } catch (error) {
      throw new AppError({
        code: 'OPERATION_FAILED',
        message: 'Failed to assign role',
        context: { userId, role, error: (error as Error).message }
      });
    }
  }

  async verifyRole(userId: string, requiredRole: string): Promise<boolean> {
    try {
      const user = await adminAuth.getUser(userId);
      return user.customClaims?.role === requiredRole;
    } catch (error) {
      throw new AppError({
        code: 'OPERATION_FAILED',
        message: 'Failed to verify role',
        context: { userId, requiredRole, error: (error as Error).message }
      });
    }
  }
} 