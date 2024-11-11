import * as functions from "firebase-functions";
import { onCall } from "firebase-functions/v2/https";
import type { CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import type { 
  QueryDocumentSnapshot, 
  DocumentData,
  Timestamp 
} from 'firebase-admin/firestore';
import axios, { isAxiosError } from "axios";
import * as crypto from "crypto";
import { onSchedule } from "firebase-functions/v2/scheduler";

interface WebhookPayload {
  eventType: string;
  data: unknown;
  timestamp: number;
  signature: string;
}

interface WebhookConfig {
  url: string;
  secret: string;
  timeout: number;
  enabled: boolean;
  events: string[];
}

interface WebhookRequest {
  url: string;
  payload: WebhookPayload;
  timeout?: number;
}

interface WebhookLogEntry {
  webhookId: string;
  success: boolean;
  details: Record<string, unknown>;
  timestamp: Timestamp;
}

const validateSignature = (
  payload: Record<string, unknown>,
  signature: string,
  secret: string,
): boolean => {
  const hmac = crypto.createHmac("sha256", secret);
  const expectedSignature = hmac
    .update(JSON.stringify(payload))
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
};

const logWebhookAttempt = async (
  webhookId: string,
  success: boolean,
  details: Record<string, unknown>,
): Promise<void> => {
  const logEntry: WebhookLogEntry = {
    webhookId,
    success,
    details,
    timestamp: admin.firestore.Timestamp.now(),
  };

  await admin.firestore().collection("webhookLogs").add(logEntry);
};

export const sendWebhook = onCall(
  async (request: CallableRequest<WebhookRequest>) => {
    // Validate request
    if (!request.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated to send webhooks",
      );
    }

    const { url, payload, timeout = 30000 } = request.data;
    let webhookConfigSnapshot;

    try {
      // Get webhook config
      webhookConfigSnapshot = await admin.firestore()
        .collection("webhookConfigs")
        .where("url", "==", url)
        .where("enabled", "==", true)
        .limit(1)
        .get();

      if (webhookConfigSnapshot.empty) {
        throw new functions.https.HttpsError(
          "not-found",
          "Webhook configuration not found or disabled",
        );
      }

      const config = webhookConfigSnapshot.docs[0].data() as WebhookConfig;

      // Validate signature
      if (!validateSignature(
        { eventType: payload.eventType, data: payload.data, timestamp: payload.timestamp },
        payload.signature,
        config.secret,
      )) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Invalid webhook signature",
        );
      }

      // Validate event type
      if (!config.events.includes(payload.eventType)) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Event type not configured for this webhook",
        );
      }

      // Send webhook
      const response = await axios({
        method: "POST",
        url: config.url,
        data: payload,
        timeout: config.timeout || timeout,
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": payload.signature,
          "User-Agent": "OneSong-Webhook/1.0",
        },
      });

      // Log success
      await logWebhookAttempt(webhookConfigSnapshot.docs[0].id, true, {
        statusCode: response.status,
        responseTime: response.headers["x-response-time"],
        payload,
      });

      return {
        success: true,
        statusCode: response.status,
        responseTime: response.headers["x-response-time"],
      };
    } catch (error: unknown) {
      // Log failure
      if (webhookConfigSnapshot?.docs[0]) {
        await logWebhookAttempt(
          webhookConfigSnapshot.docs[0].id,
          false,
          {
            error: error instanceof Error ? error.message : "Unknown error",
            code: error instanceof Error && "code" in error ? (error as any).code : undefined,
            payload,
          },
        );
      }

      if (isAxiosError(error)) {
        throw new functions.https.HttpsError(
          "unavailable",
          `Webhook delivery failed: ${error.message}`,
          {
            statusCode: error.response?.status,
            responseData: error.response?.data,
          },
        );
      }

      throw new functions.https.HttpsError(
        "internal",
        `Webhook processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
);

export const cleanupWebhookLogs = onSchedule(
  {
    schedule: "0 0 * * *", // every day at midnight
    timeZone: "UTC",
    retryCount: 3,
    maxRetrySeconds: 60
  },
  async () => {
    try {
      const thirtyDaysAgo = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );

      const snapshot = await admin.firestore()
        .collection("webhookLogs")
        .where("timestamp", "<", thirtyDaysAgo)
        .get();

      if (snapshot.empty) {
        functions.logger.info("No webhook logs to clean up");
        return;
      }

      const batch = admin.firestore().batch();
      let deletedCount = 0;

      snapshot.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      await batch.commit();

      // Track cleanup metrics with operation timestamp instead of execution ID
      functions.logger.info("Webhook logs cleanup completed", {
        deletedCount,
        olderThan: thirtyDaysAgo.toDate().toISOString(),
        timestamp: admin.firestore.Timestamp.now().toDate().toISOString()
      });

    } catch (error) {
      functions.logger.error("Webhook logs cleanup failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: admin.firestore.Timestamp.now().toDate().toISOString()
      });
      throw error;
    }
  }
);

// Optional: Add metrics tracking
export const getWebhookMetrics = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be authenticated to get webhook metrics",
    );
  }

  try {
    const last24Hours = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 24 * 60 * 60 * 1000),
    );

    const logsSnapshot = await admin.firestore()
      .collection("webhookLogs")
      .where("timestamp", ">=", last24Hours)
      .get();

    const metrics = {
      total: logsSnapshot.size,
      successful: 0,
      failed: 0,
      averageResponseTime: 0,
    };

    let totalResponseTime = 0;
    let responseTimes = 0;

    logsSnapshot.docs.forEach((doc) => {
      const log = doc.data() as WebhookLogEntry;
      if (log.success) {
        metrics.successful++;
        if (log.details.responseTime) {
          totalResponseTime += Number(log.details.responseTime);
          responseTimes++;
        }
      } else {
        metrics.failed++;
      }
    });

    metrics.averageResponseTime = responseTimes ? totalResponseTime / responseTimes : 0;

    return metrics;
  } catch (error) {
    functions.logger.error("Error getting webhook metrics", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to get webhook metrics",
    );
  }
});