import * as functions from "firebase-functions";
import { onCall } from "firebase-functions/v2/https";
import type { CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
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
}

interface WebhookRequest {
  url: string;
  payload: WebhookPayload;
  timeout?: number;
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
  await admin.firestore().collection("webhookLogs").add({
    webhookId,
    success,
    details,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
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
        .limit(1)
        .get();

      if (webhookConfigSnapshot.empty) {
        throw new functions.https.HttpsError(
          "not-found",
          "Webhook configuration not found",
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
      if (webhookConfigSnapshot) {
        await logWebhookAttempt(
          webhookConfigSnapshot.docs[0].id,
          false,
          {
            error: error instanceof Error ? error.message : "Unknown error",
            code: error instanceof Error && "code" in error ? error.code : undefined,
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

// Cleanup old webhook logs
export const cleanupWebhookLogs = onSchedule(
  {
    schedule: "0 0 * * *", // every day at midnight
    timeZone: "UTC",
  },
  async () => {
    const thirtyDaysAgo = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    );

    const snapshot = await admin.firestore()
      .collection("webhookLogs")
      .where("timestamp", "<", thirtyDaysAgo)
      .get();

    const batch = admin.firestore().batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    functions.logger.info(`Cleaned up ${snapshot.size} webhook logs`);
  },
);
