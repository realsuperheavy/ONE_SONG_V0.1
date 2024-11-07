import { render, fireEvent, waitFor } from '@/test/utils/test-utils';
import { SearchBar } from '../SearchBar';

describe('SearchBar', () => {
  const mockOnSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce search input', async () => {
    const { getByPlaceholderText } = render(
      <SearchBar onSearch={mockOnSearch} placeholder="Search songs..." />
    );

    const input = getByPlaceholderText('Search songs...');
    fireEvent.change(input, { target: { value: 'test' } });

    expect(mockOnSearch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('test');
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
    });
  });

  it('should clear search input', () => {
    const { getByPlaceholderText, getByRole } = render(
      <SearchBar onSearch={mockOnSearch} placeholder="Search songs..." />
    );

    const input = getByPlaceholderText('Search songs...');
    fireEvent.change(input, { target: { value: 'test' } });

    const clearButton = getByRole('button');
    fireEvent.click(clearButton);

    expect(input).toHaveValue('');
    expect(mockOnSearch).toHaveBeenCalledWith('');
  });
}); 