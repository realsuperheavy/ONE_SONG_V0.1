import { render, fireEvent, waitFor } from '@/test/utils/test-utils';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('calls onSearch with debounced value', async () => {
    const onSearch = vi.fn();
    const { getByPlaceholderText } = render(
      <SearchBar onSearch={onSearch} placeholder="Search..." />
    );

    const input = getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'test' } });

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('test');
    }, { timeout: 500 });
  });
}); 