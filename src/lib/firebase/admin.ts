import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { PerformanceMetricsCollector } from '@/lib/monitoring/PerformanceMetricsCollector';
import { analyticsService } from '@/lib/firebase/services/analytics';

const performanceMonitor = new PerformanceMetricsCollector();

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const adminDb = getFirestore();
const adminAuth = getAuth();

// Enhanced admin methods with performance monitoring and error handling
export const admin = {
  db: {
    collection: (path: string) => {
      performanceMonitor.startOperation('adminDbCollection');
      try {
        const collection = adminDb.collection(path);
        performanceMonitor.endOperation('adminDbCollection');
        return collection;
      } catch (error) {
        performanceMonitor.trackError('adminDbCollection');
        analyticsService.trackError(error as Error, {
          context: 'admin_db_collection',
          path
        });
        throw error;
      }
    },

    async getDocument(path: string) {
      performanceMonitor.startOperation('adminDbGetDoc');
      try {
        const doc = await adminDb.doc(path).get();
        performanceMonitor.endOperation('adminDbGetDoc');
        return doc;
      } catch (error) {
        performanceMonitor.trackError('adminDbGetDoc');
        analyticsService.trackError(error as Error, {
          context: 'admin_db_get_doc',
          path
        });
        throw error;
      }
    },

    async setDocument(path: string, data: any) {
      performanceMonitor.startOperation('adminDbSetDoc');
      try {
        await adminDb.doc(path).set(data);
        performanceMonitor.endOperation('adminDbSetDoc');
        analyticsService.trackEvent('admin_doc_set', { path });
      } catch (error) {
        performanceMonitor.trackError('adminDbSetDoc');
        analyticsService.trackError(error as Error, {
          context: 'admin_db_set_doc',
          path
        });
        throw error;
      }
    },

    async batchWrite(operations: Array<{
      type: 'set' | 'update' | 'delete';
      path: string;
      data?: any;
    }>) {
      performanceMonitor.startOperation('adminDbBatchWrite');
      const batch = adminDb.batch();

      try {
        operations.forEach(op => {
          const docRef = adminDb.doc(op.path);
          switch (op.type) {
            case 'set':
              batch.set(docRef, op.data);
              break;
            case 'update':
              batch.update(docRef, op.data);
              break;
            case 'delete':
              batch.delete(docRef);
              break;
          }
        });

        await batch.commit();
        performanceMonitor.endOperation('adminDbBatchWrite');
        
        analyticsService.trackEvent('admin_batch_write', {
          operationCount: operations.length
        });
      } catch (error) {
        performanceMonitor.trackError('adminDbBatchWrite');
        analyticsService.trackError(error as Error, {
          context: 'admin_db_batch_write',
          operationCount: operations.length
        });
        throw error;
      }
    }
  },

  auth: {
    async verifyIdToken(token: string) {
      performanceMonitor.startOperation('verifyIdToken');
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        performanceMonitor.endOperation('verifyIdToken');
        return decodedToken;
      } catch (error) {
        performanceMonitor.trackError('verifyIdToken');
        analyticsService.trackError(error as Error, {
          context: 'verify_id_token'
        });
        throw error;
      }
    },

    async createCustomToken(uid: string, claims?: Record<string, any>) {
      performanceMonitor.startOperation('createCustomToken');
      try {
        const token = await adminAuth.createCustomToken(uid, claims);
        performanceMonitor.endOperation('createCustomToken');
        return token;
      } catch (error) {
        performanceMonitor.trackError('createCustomToken');
        analyticsService.trackError(error as Error, {
          context: 'create_custom_token',
          uid
        });
        throw error;
      }
    },

    async revokeRefreshTokens(uid: string) {
      performanceMonitor.startOperation('revokeRefreshTokens');
      try {
        await adminAuth.revokeRefreshTokens(uid);
        performanceMonitor.endOperation('revokeRefreshTokens');
        analyticsService.trackEvent('tokens_revoked', { uid });
      } catch (error) {
        performanceMonitor.trackError('revokeRefreshTokens');
        analyticsService.trackError(error as Error, {
          context: 'revoke_refresh_tokens',
          uid
        });
        throw error;
      }
    }
  }
};

export { adminDb, adminAuth };