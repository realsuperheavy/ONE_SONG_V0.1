export class TipManagementFlow {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly analyticsService: AnalyticsService,
    private readonly taxService: TaxService
  ) {}

  async getTransactionHistory(djId: string, filters: TransactionFilters): Promise<TransactionHistory> {
    const [transactions, analytics] = await Promise.all([
      this.paymentService.getTransactions(djId, filters),
      this.analyticsService.getTipMetrics(djId, filters.timeRange)
    ]);

    return {
      transactions,
      summary: {
        totalAmount: analytics.totalAmount,
        averageTip: analytics.averageTip,
        topTippers: analytics.topTippers,
        peakTimes: analytics.peakTimes
      }
    };
  }

  async configurePayout(djId: string, config: PayoutConfig): Promise<void> {
    await this.paymentService.updatePayoutSchedule(djId, {
      frequency: config.frequency,
      minimumAmount: config.minimumAmount,
      bankAccount: config.bankAccount
    });
  }

  async generateTaxReport(djId: string, year: number): Promise<TaxReport> {
    return this.taxService.generateAnnualReport(djId, year);
  }
} 