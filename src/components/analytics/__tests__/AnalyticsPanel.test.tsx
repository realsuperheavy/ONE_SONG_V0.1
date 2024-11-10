import { render, screen, fireEvent } from '@testing-library/react';
import { AnalyticsPanel } from '../AnalyticsPanel';
import { useAnalytics } from '@/hooks/useAnalytics';
import { vi } from 'vitest';

vi.mock('@/hooks/useAnalytics');

describe('AnalyticsPanel', () => {
  beforeEach(() => {
    vi.mocked(useAnalytics).mockReturnValue({
      requestTrends: [],
      genreDistribution: [],
      audienceEngagement: [],
      tipStats: [],
      isLoading: false,
      error: null
    });
  });

  it('renders all analytics tabs', () => {
    render(<AnalyticsPanel eventId="test-event" />);
    
    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /requests/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /engagement/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /revenue/i })).toBeInTheDocument();
  });

  // Add more tests...
}); 