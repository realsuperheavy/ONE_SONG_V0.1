import { render, fireEvent, screen } from '@testing-library/react';
import { QueueItem } from '../QueueItem';
import { analyticsService } from '@/lib/firebase/services/analytics';

jest.mock('@/lib/firebase/services/analytics');

describe('QueueItem', () => {
  const mockItem = {
    id: 'test-123',
    eventId: 'event-123',
    song: {
      title: 'Test Song',
      artist: 'Test Artist',
      albumArt: 'test-image.jpg'
    },
    status: 'pending',
    queuePosition: 1,
    addedAt: Date.now().toString(),
    metadata: {
      requestTime: Date.now(),
      votes: 0
    }
  };

  const mockProps = {
    item: mockItem,
    eventId: 'event-123',
    isDragging: false,
    onRemove: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders queue item correctly', () => {
    render(<QueueItem {...mockProps} />);
    
    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  it('handles remove action', async () => {
    render(<QueueItem {...mockProps} />);
    
    const removeButton = screen.getByRole('button');
    await fireEvent.click(removeButton);
    
    expect(mockProps.onRemove).toHaveBeenCalledWith(mockItem.id);
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'queue_item_removed',
      expect.objectContaining({
        eventId: mockProps.eventId,
        itemId: mockItem.id
      })
    );
  });

  it('shows dragging state correctly', () => {
    render(<QueueItem {...mockProps} isDragging={true} />);
    
    expect(screen.getByTestId('queue-item')).toHaveClass('opacity-50');
  });
}); 