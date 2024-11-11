import { adminDb, adminAuth } from '../admin';
import type { UserPreferences, UserProfile } from '@/types/models';

export class UserService {
  constructor(private readonly db = adminDb) {}

  async updateUserPreferences(
    userId: string, 
    preferences: Partial<UserPreferences>
  ): Promise<void> {
    const userRef = this.db.collection('users').doc(userId);
    
    await this.db.runTransaction(async transaction => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) throw new Error('User not found');

      const currentPrefs = (userDoc.data()?.preferences || {}) as UserPreferences;
      
      transaction.update(userRef, {
        preferences: {
          ...currentPrefs,
          ...preferences,
          updatedAt: new Date()
        }
      });
    });
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    const [userDoc, authUser] = await Promise.all([
      this.db.collection('users').doc(userId).get(),
      adminAuth.getUser(userId)
    ]);

    if (!userDoc.exists) throw new Error('User profile not found');

    return {
      ...userDoc.data() as UserProfile,
      email: authUser.email,
      emailVerified: authUser.emailVerified,
      displayName: authUser.displayName,
      photoURL: authUser.photoURL
    };
  }
} 