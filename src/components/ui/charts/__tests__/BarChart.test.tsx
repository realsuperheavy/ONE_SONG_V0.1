import { render, fireEvent, screen } from '@testing-library/react';
import { BarChart } from '../BarChart';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { AccessibilityProvider } from '@/providers/accessibility/AccessibilityProvider';

jest.mock('@/lib/firebase/services/analytics');
jest.mock('@/lib/monitoring/PerformanceMetricsCollector');

describe('BarChart', () => {
  const mockData = [
    { label: 'A', value: 10 },
    { label: 'B', value: 20 },
    { label: 'C', value: 15 }
  ];

  const renderChart = (props = {}) => {
    return render(
      <AccessibilityProvider>
        <BarChart data={mockData} {...props} />
      </AccessibilityProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderChart();
    expect(screen.getByRole('img', { name: /bar chart/i })).toBeInTheDocument();
  });

  it('announces chart data for screen readers', () => {
    const mockAnnounce = jest.fn();
    jest.spyOn(require('@/providers/accessibility/AccessibilityProvider'), 'useAccessibility')
      .mockReturnValue({ announceMessage: mockAnnounce });

    renderChart();

    expect(mockAnnounce).toHaveBeenCalledWith(
      expect.stringContaining('Bar chart showing 3 items')
    );
  });

  it('tracks click events', () => {
    const onBarClick = jest.fn();
    renderChart({ onBarClick });

    // Simulate chart click
    const chart = screen.getByRole('img', { name: /bar chart/i });
    fireEvent.click(chart);

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'chart_interaction',
      expect.any(Object)
    );
  });
}); 