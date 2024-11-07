import { render, screen, fireEvent } from '@testing-library/react';
import { DJDashboard } from '../Dashboard';
import { useEventData } from '@/hooks/useEventData';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// Mock hooks
vi.mock('@/hooks/useEventData');
vi.mock('@/hooks/useMediaQuery');

describe('DJDashboard', () => {
  const mockEventData = {
    event: { id: 'event-1' },
    requests: [],
    queue: []
  };

  beforeEach(() => {
    vi.mocked(useEventData).mockReturnValue(mockEventData);
    vi.mocked(useMediaQuery).mockReturnValue(false); // Default to desktop
  });

  it('renders all navigation items with correct ARIA attributes', () => {
    render(<DJDashboard eventId="event-1" />);
    
    const queueNav = screen.getByRole('tab', { name: /queue/i });
    const requestsNav = screen.getByRole('tab', { name: /requests/i });
    const analyticsNav = screen.getByRole('tab', { name: /analytics/i });

    expect(queueNav).toHaveAttribute('aria-current', 'page');
    expect(requestsNav).not.toHaveAttribute('aria-current');
    expect(analyticsNav).not.toHaveAttribute('aria-current');
  });

  it('switches views when navigation items are clicked', () => {
    render(<DJDashboard eventId="event-1" />);
    
    fireEvent.click(screen.getByRole('tab', { name: /requests/i }));
    expect(screen.getByLabelText('Request Management')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /analytics/i }));
    expect(screen.getByLabelText('Analytics Dashboard')).toBeInTheDocument();
  });

  it('applies mobile styles when on mobile viewport', () => {
    vi.mocked(useMediaQuery).mockReturnValue(true); // Mobile view
    const { container } = render(<DJDashboard eventId="event-1" />);

    expect(container.querySelector('nav')).toHaveClass(
      'col-span-1',
      'overflow-x-auto',
      'pb-2'
    );
  });

  it('applies desktop styles when on desktop viewport', () => {
    vi.mocked(useMediaQuery).mockReturnValue(false); // Desktop view
    const { container } = render(<DJDashboard eventId="event-1" />);

    expect(container.querySelector('nav')).toHaveClass(
      'col-span-2',
      'flex-col'
    );
  });

  it('handles keyboard navigation correctly', () => {
    render(<DJDashboard eventId="event-1" />);
    
    const queueNav = screen.getByRole('tab', { name: /queue/i });
    queueNav.focus();

    // Navigate with arrow keys
    fireEvent.keyDown(queueNav, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: /requests/i })).toHaveFocus();

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: /analytics/i })).toHaveFocus();
  });

  it('maintains ARIA live region for content updates', () => {
    render(<DJDashboard eventId="event-1" />);
    
    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveAttribute('aria-live', 'polite');
  });
}); 