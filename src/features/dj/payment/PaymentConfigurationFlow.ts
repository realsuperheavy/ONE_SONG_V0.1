export class PaymentConfigurationFlow {
  constructor(
    private readonly stripeService: StripeService,
    private readonly wiseService: WiseService,
    private readonly configService: ConfigService,
    private readonly analyticsService: AnalyticsService
  ) {}

  async setupPaymentProvider(djId: string, providerData: PaymentProviderSetup): Promise<void> {
    try {
      // Create payment account based on country
      const account = await this.createPaymentAccount(djId, providerData);
      
      // Configure payout settings
      await this.setupPayoutConfig(account.id, providerData.payoutConfig);
      
      // Set tip configuration
      await this.configService.setTipConfig(djId, {
        minimumAmount: providerData.minimumTip,
        customAmounts: providerData.quickTipAmounts,
        currency: providerData.currency
      });

      this.analyticsService.trackEvent('payment_provider_configured', {
        djId,
        provider: account.provider
      });
    } catch (error) {
      this.analyticsService.trackError('payment_setup_failed', error);
      throw error;
    }
  }

  private async createPaymentAccount(
    djId: string, 
    data: PaymentProviderSetup
  ): Promise<PaymentAccount> {
    // Use appropriate provider based on country
    const provider = this.determineProvider(data.country);
    
    if (provider === 'stripe') {
      return this.stripeService.createConnectedAccount(djId, data);
    } else {
      return this.wiseService.createRecipientAccount(djId, data);
    }
  }
} 