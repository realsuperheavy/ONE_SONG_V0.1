export const useTipping = (eventId: string) => {
  const { event } = useEvent(eventId);
  const { processTip, isProcessing } = usePaymentProcessor();

  // Get tip presets from event settings or use defaults
  const tipPresets = useMemo(() => 
    event?.tipSettings?.presets || [1, 2, 5, 'custom']
  , [event]);

  const handleTip = async (tipData: TipRequest): Promise<TipResult> => {
    try {
      // Process payment
      const result = await processTip({
        eventId,
        ...tipData,
        timestamp: Date.now()
      });

      // Track analytics
      analyticsService.trackEvent('tip_processed', {
        eventId,
        amount: tipData.amount,
        requestId: tipData.requestId
      });

      return result;
    } catch (error) {
      analyticsService.trackError('tip_failed', error);
      throw error;
    }
  };

  return {
    tipPresets,
    processTip: handleTip,
    isProcessing
  };
}; 