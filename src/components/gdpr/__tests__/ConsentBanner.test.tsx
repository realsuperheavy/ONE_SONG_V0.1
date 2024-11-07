import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConsentBanner } from '../ConsentBanner';
import { GDPRDataManager } from '@/lib/gdpr/DataManager';
import { analyticsService } from '@/lib/firebase/services/analytics';

// Mock dependencies
vi.mock('@/lib/gdpr/DataManager');
vi.mock('@/lib/firebase/services/analytics');

describe('ConsentBanner', () => {
  const mockUserId = 'test-user-123';
  const mockOnConsent = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders basic banner with accept all and customize options', () => {
    render(<ConsentBanner userId={mockUserId} onConsent={mockOnConsent} />);
    
    expect(screen.getByText('Cookie Preferences')).toBeInTheDocument();
    expect(screen.getByText(/We use cookies/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Accept All/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Customize/i })).toBeInTheDocument();
  });

  it('expands to show detailed options when customize is clicked', () => {
    render(<ConsentBanner userId={mockUserId} onConsent={mockOnConsent} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Customize/i }));
    
    expect(screen.getByLabelText('Necessary cookies (required)')).toBeInTheDocument();
    expect(screen.getByLabelText('Analytics cookies')).toBeInTheDocument();
    expect(screen.getByLabelText('Marketing cookies')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Preferences/i })).toBeInTheDocument();
  });

  it('handles accept all correctly', async () => {
    render(<ConsentBanner userId={mockUserId} onConsent={mockOnConsent} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Accept All/i }));
    
    await waitFor(() => {
      expect(GDPRDataManager.prototype.updateConsent).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          necessary: true,
          analytics: true,
          marketing: true
        })
      );
    });
    
    expect(mockOnConsent).toHaveBeenCalled();
  });

  it('handles custom preferences correctly', async () => {
    render(<ConsentBanner userId={mockUserId} onConsent={mockOnConsent} />);
    
    // Open detailed view
    fireEvent.click(screen.getByRole('button', { name: /Customize/i }));
    
    // Toggle some preferences
    fireEvent.click(screen.getByLabelText('Analytics cookies'));
    fireEvent.click(screen.getByLabelText('Marketing cookies'));
    
    // Save preferences
    fireEvent.click(screen.getByRole('button', { name: /Save Preferences/i }));
    
    await waitFor(() => {
      expect(GDPRDataManager.prototype.updateConsent).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          necessary: true,
          analytics: true,
          marketing: true
        })
      );
    });
    
    expect(mockOnConsent).toHaveBeenCalled();
  });

  it('handles errors gracefully', async () => {
    const error = new Error('Update failed');
    vi.mocked(GDPRDataManager.prototype.updateConsent).mockRejectedValueOnce(error);
    
    render(<ConsentBanner userId={mockUserId} onConsent={mockOnConsent} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Accept All/i }));
    
    await waitFor(() => {
      expect(analyticsService.trackError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          context: 'consent_banner'
        })
      );
    });
  });
}); 