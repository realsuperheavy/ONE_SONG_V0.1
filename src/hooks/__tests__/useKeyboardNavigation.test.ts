import { renderHook } from '@testing-library/react-hooks';
import { useKeyboardNavigation } from '../useKeyboardNavigation';
import { fireEvent } from '@testing-library/react';

describe('useKeyboardNavigation', () => {
  const mockHandlers = {
    onArrowUp: vi.fn(),
    onArrowDown: vi.fn(),
    onArrowLeft: vi.fn(),
    onArrowRight: vi.fn(),
    onEnter: vi.fn(),
    onEscape: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls correct handler for arrow up key', () => {
    renderHook(() => useKeyboardNavigation(mockHandlers));
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    expect(mockHandlers.onArrowUp).toHaveBeenCalled();
  });

  it('calls correct handler for arrow down key', () => {
    renderHook(() => useKeyboardNavigation(mockHandlers));
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(mockHandlers.onArrowDown).toHaveBeenCalled();
  });

  it('calls correct handler for enter key', () => {
    renderHook(() => useKeyboardNavigation(mockHandlers));
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(mockHandlers.onEnter).toHaveBeenCalled();
  });

  it('calls correct handler for escape key', () => {
    renderHook(() => useKeyboardNavigation(mockHandlers));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockHandlers.onEscape).toHaveBeenCalled();
  });

  it('does not call handlers when disabled', () => {
    renderHook(() => useKeyboardNavigation({ ...mockHandlers, enabled: false }));
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    expect(mockHandlers.onArrowUp).not.toHaveBeenCalled();
  });

  it('removes event listener on cleanup', () => {
    const { unmount } = renderHook(() => useKeyboardNavigation(mockHandlers));
    unmount();
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    expect(mockHandlers.onArrowUp).not.toHaveBeenCalled();
  });
}); 