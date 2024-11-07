import { renderHook } from '@testing-library/react-hooks';
import { useFocusManagement } from '../useFocusManagement';
import { render, fireEvent } from '@testing-library/react';

describe('useFocusManagement', () => {
  const TestComponent = ({ 
    autoFocus = false, 
    trapFocus = false, 
    returnFocus = true 
  }) => {
    const containerRef = useFocusManagement({ autoFocus, trapFocus, returnFocus });
    
    return (
      <div ref={containerRef}>
        <button>First</button>
        <input type="text" />
        <button>Last</button>
      </div>
    );
  };

  it('auto-focuses first focusable element when autoFocus is true', () => {
    const { container } = render(<TestComponent autoFocus />);
    const firstButton = container.querySelector('button');
    expect(document.activeElement).toBe(firstButton);
  });

  it('traps focus within container when trapFocus is true', () => {
    const { container } = render(<TestComponent trapFocus />);
    const firstButton = container.querySelector('button');
    const lastButton = container.querySelectorAll('button')[1];

    // Focus last button and press Tab
    lastButton?.focus();
    fireEvent.keyDown(lastButton!, { key: 'Tab' });
    expect(document.activeElement).toBe(firstButton);

    // Focus first button and press Shift+Tab
    firstButton?.focus();
    fireEvent.keyDown(firstButton!, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(lastButton);
  });

  it('returns focus to previous element when unmounted and returnFocus is true', () => {
    const previousFocusedElement = document.createElement('button');
    document.body.appendChild(previousFocusedElement);
    previousFocusedElement.focus();

    const { unmount } = render(<TestComponent returnFocus />);
    unmount();

    expect(document.activeElement).toBe(previousFocusedElement);
    document.body.removeChild(previousFocusedElement);
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = render(<TestComponent trapFocus />);
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );
  });
}); 