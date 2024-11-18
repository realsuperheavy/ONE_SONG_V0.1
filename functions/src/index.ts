/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as functions from 'firebase-functions';
import { webhookService } from '../../src/lib/webhooks/webhookService';

// Export webhooks functions
export * from "./webhooks";

// Example function
export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase!");
});

export const handleEventCreated = functions.firestore
  .document('events/{eventId}')
  .onCreate(async (snapshot) => {
    const eventData = snapshot.data();
    await webhookService.triggerWebhooks('event_created', eventData);
  });
