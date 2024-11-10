import { useState, useRef, useEffect } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
  loading?: boolean;
  debounceMs?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search...',
  initialValue = '',
  loading = false,
  debounceMs = 300,
}) => {
  const [value, setValue] = useState(initialValue);
  const debounceTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      onSearch(newValue);
    }, debounceMs);
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
        <SearchIcon size={20} />
      </div>
      <Input
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-10 pr-12"
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
          onClick={handleClear}
        >
          <XIcon size={16} />
        </Button>
      )}
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-[#F49620] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
});

SearchBar.displayName = 'SearchBar'; 