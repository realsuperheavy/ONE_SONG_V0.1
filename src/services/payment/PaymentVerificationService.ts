export class PaymentVerificationService {
  constructor(
    private readonly stripe: Stripe,
    private readonly db: FirebaseFirestore.Firestore,
    private readonly analyticsService: AnalyticsService
  ) {}

  async initiateVerification(userId: string): Promise<{ url: string }> {
    try {
      // Create or get Stripe account
      const account = await this.getOrCreateStripeAccount(userId);

      // Create account link for verification
      const accountLink = await this.stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?verification=refresh`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?verification=complete`,
        type: 'account_onboarding',
        collect: 'eventually_due'
      });

      // Track verification initiation
      this.analyticsService.trackEvent('verification_initiated', {
        userId,
        accountId: account.id
      });

      return { url: accountLink.url };
    } catch (error) {
      this.analyticsService.trackError('verification_initiation_failed', error);
      throw error;
    }
  }

  async checkVerificationStatus(userId: string): Promise<VerificationStatus> {
    const account = await this.getStripeAccount(userId);
    if (!account) return { isVerified: false };

    const status = {
      isVerified: account.details_submitted && !account.requirements?.currently_due?.length,
      requirements: account.requirements?.currently_due || [],
      lastChecked: Date.now()
    };

    // Update user profile with verification status
    await this.updateUserVerificationStatus(userId, status);

    return status;
  }

  private async getOrCreateStripeAccount(userId: string) {
    const existing = await this.getStripeAccount(userId);
    if (existing) return existing;

    // Create new Stripe account
    const account = await this.stripe.accounts.create({
      type: 'express',
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true }
      },
      metadata: { userId }
    });

    // Save account reference
    await this.saveStripeAccount(userId, account.id);

    return account;
  }
} 