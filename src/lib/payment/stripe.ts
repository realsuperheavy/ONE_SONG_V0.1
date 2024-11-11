import Stripe from 'stripe';
import { adminDb } from '../firebase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export class PaymentService {
  constructor(private readonly db = adminDb) {}

  async createTipPaymentIntent(
    eventId: string,
    requestId: string,
    amount: number,
    currency: string = 'usd'
  ) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        eventId,
        requestId,
        type: 'tip'
      }
    });

    await this.db.collection('payments').doc(paymentIntent.id).set({
      eventId,
      requestId,
      amount,
      currency,
      status: paymentIntent.status,
      createdAt: new Date()
    });

    return paymentIntent.client_secret;
  }

  async handleWebhook(event: Stripe.Event) {
    const { type, data } = event;

    switch (type) {
      case 'payment_intent.succeeded':
        await this.handleSuccessfulPayment(data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handleFailedPayment(data.object as Stripe.PaymentIntent);
        break;
    }
  }

  private async handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
    const { eventId, requestId } = paymentIntent.metadata;

    await this.db.runTransaction(async (transaction) => {
      const eventRef = this.db.collection('events').doc(eventId);
      const requestRef = this.db.collection('requests').doc(requestId);

      const [eventDoc, requestDoc] = await Promise.all([
        transaction.get(eventRef),
        transaction.get(requestRef)
      ]);

      if (!eventDoc.exists || !requestDoc.exists) {
        throw new Error('Event or request not found');
      }

      // Update event stats
      transaction.update(eventRef, {
        'stats.totalTips': eventDoc.data()!.stats.totalTips + paymentIntent.amount
      });

      // Update request metadata
      transaction.update(requestRef, {
        'metadata.tipAmount': paymentIntent.amount
      });
    });
  }

  private async handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
    await this.db.collection('payments').doc(paymentIntent.id).update({
      status: 'failed',
      error: paymentIntent.last_payment_error?.message,
      updatedAt: new Date()
    });
  }
} 