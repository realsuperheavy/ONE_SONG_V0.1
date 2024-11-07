import '@testing-library/jest-dom';
import { vi } from 'vitest';

declare global {
  const describe: typeof vi.describe;
  const it: typeof vi.it;
  const expect: typeof vi.expect;
  const beforeEach: typeof vi.beforeEach;
  const afterEach: typeof vi.afterEach;
  const vi: typeof import('vitest').vi;
  
  namespace jest {
    interface Mock<T = any, Y extends any[] = any> {
      mockImplementation: (fn: (...args: Y) => T) => Mock<T, Y>;
      mockRejectedValueOnce: (value: any) => Mock<T, Y>;
      mockResolvedValueOnce: (value: T) => Mock<T, Y>;
    }
  }
} 