import { render } from '@/test/utils/test-utils';
import { SearchResults } from '../SearchResults';

describe('SearchResults', () => {
  const mockResults = [
    {
      id: '1',
      title: 'Test Track 1',
      artist: 'Artist 1',
      albumArt: 'https://example.com/art1.jpg',
      duration: 30000
    },
    {
      id: '2',
      title: 'Test Track 2',
      artist: 'Artist 2',
      albumArt: 'https://example.com/art2.jpg',
      duration: 40000
    }
  ];

  it('should render loading state', () => {
    const { getByRole } = render(
      <SearchResults
        results={[]}
        loading={true}
        error={null}
        onSelect={() => {}}
      />
    );

    expect(getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render error state', () => {
    const error = 'Search failed';
    const { getByText } = render(
      <SearchResults
        results={[]}
        loading={false}
        error={error}
        onSelect={() => {}}
      />
    );

    expect(getByText(error)).toBeInTheDocument();
  });

  it('should render empty state', () => {
    const { getByText } = render(
      <SearchResults
        results={[]}
        loading={false}
        error={null}
        onSelect={() => {}}
      />
    );

    expect(getByText('No songs found')).toBeInTheDocument();
  });

  it('should render search results', () => {
    const { getByText } = render(
      <SearchResults
        results={mockResults}
        loading={false}
        error={null}
        onSelect={() => {}}
      />
    );

    expect(getByText('Test Track 1')).toBeInTheDocument();
    expect(getByText('Test Track 2')).toBeInTheDocument();
  });

  it('should handle track selection', () => {
    const handleSelect = vi.fn();
    const { getAllByRole } = render(
      <SearchResults
        results={mockResults}
        loading={false}
        error={null}
        onSelect={handleSelect}
      />
    );

    const tracks = getAllByRole('button');
    tracks[0].click();

    expect(handleSelect).toHaveBeenCalledWith(mockResults[0]);
  });
}); 