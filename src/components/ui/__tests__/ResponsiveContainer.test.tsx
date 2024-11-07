import { render, screen } from '@testing-library/react';
import { ResponsiveContainer } from '../ResponsiveContainer';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// Mock the useMediaQuery hook
vi.mock('@/hooks/useMediaQuery');

describe('ResponsiveContainer', () => {
  beforeEach(() => {
    vi.mocked(useMediaQuery).mockReturnValue(false); // Default to desktop
  });

  it('renders children correctly', () => {
    render(
      <ResponsiveContainer>
        <div>Test Content</div>
      </ResponsiveContainer>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies correct max-width classes based on prop', () => {
    const { container: smContainer } = render(
      <ResponsiveContainer maxWidth="sm">
        <div>Content</div>
      </ResponsiveContainer>
    );
    expect(smContainer.firstChild).toHaveClass('sm:max-w-screen-sm');

    const { container: xlContainer } = render(
      <ResponsiveContainer maxWidth="xl">
        <div>Content</div>
      </ResponsiveContainer>
    );
    expect(xlContainer.firstChild).toHaveClass('xl:max-w-screen-xl');
  });

  it('applies padding classes when padding prop is true', () => {
    const { container } = render(
      <ResponsiveContainer padding>
        <div>Content</div>
      </ResponsiveContainer>
    );
    expect(container.firstChild).toHaveClass('px-4', 'md:px-6', 'lg:px-8');
  });

  it('does not apply padding classes when padding prop is false', () => {
    const { container } = render(
      <ResponsiveContainer padding={false}>
        <div>Content</div>
      </ResponsiveContainer>
    );
    expect(container.firstChild).not.toHaveClass('px-4', 'md:px-6', 'lg:px-8');
  });

  it('merges custom className with default classes', () => {
    const { container } = render(
      <ResponsiveContainer className="custom-class">
        <div>Content</div>
      </ResponsiveContainer>
    );
    expect(container.firstChild).toHaveClass('custom-class', 'w-full', 'mx-auto');
  });

  it('has correct role attribute', () => {
    render(
      <ResponsiveContainer>
        <div>Content</div>
      </ResponsiveContainer>
    );
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
}); 