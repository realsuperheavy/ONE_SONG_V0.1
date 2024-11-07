import { render, fireEvent, waitFor } from '@/test/utils/test-utils';
import { SearchContainer } from '../SearchContainer';
import { useSpotifySearch } from '@/hooks/useSpotifySearch';

vi.mock('@/hooks/useSpotifySearch');

describe('SearchContainer', () => {
  const mockResults = [
    { id: '1', title: 'Track 1', artist: 'Artist 1' },
    { id: '2', title: 'Track 2', artist: 'Artist 2' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSpotifySearch).mockReturnValue({
      results: mockResults,
      loading: false,
      error: null,
      search: vi.fn()
    });
  });

  it('should handle search input', async () => {
    const mockSearch = vi.fn();
    vi.mocked(useSpotifySearch).mockReturnValue({
      results: [],
      loading: false,
      error: null,
      search: mockSearch
    });

    const { getByPlaceholderText } = render(
      <SearchContainer onSelect={() => {}} />
    );

    const input = getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'test' } });

    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledWith('test');
    });
  });

  it('should handle track selection', () => {
    const handleSelect = vi.fn();
    const { getAllByRole } = render(
      <SearchContainer onSelect={handleSelect} />
    );

    const tracks = getAllByRole('button');
    tracks[0].click();

    expect(handleSelect).toHaveBeenCalledWith(mockResults[0]);
  });

  it('should show loading state', () => {
    vi.mocked(useSpotifySearch).mockReturnValue({
      results: [],
      loading: true,
      error: null,
      search: vi.fn()
    });

    const { getByRole } = render(
      <SearchContainer onSelect={() => {}} />
    );

    expect(getByRole('progressbar')).toBeInTheDocument();
  });

  it('should show error state', () => {
    const error = 'Search failed';
    vi.mocked(useSpotifySearch).mockReturnValue({
      results: [],
      loading: false,
      error,
      search: vi.fn()
    });

    const { getByText } = render(
      <SearchContainer onSelect={() => {}} />
    );

    expect(getByText(error)).toBeInTheDocument();
  });
}); 