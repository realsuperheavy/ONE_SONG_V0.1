export class StripeService {
  // BUG FIX: Race condition in concurrent payments
  private async processPayment(intent: PaymentIntent): Promise<void> {
    const lockKey = `payment:${intent.id}`;
    
    return this.lockManager.withLock(lockKey, async () => {
      // Verify intent hasn't been processed
      const existingTransaction = await this.transactionService.findByIntentId(intent.id);
      if (existingTransaction) {
        throw new PaymentError('Payment already processed');
      }
      
      // Process payment with idempotency key
      await this.stripe.paymentIntents.confirm(intent.id, {
        idempotencyKey: `confirm_${intent.id}`
      });
    });
  }
} 