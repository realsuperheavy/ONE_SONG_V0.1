import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Setup global test utilities
global.vi = vi;
global.describe = vi.describe;
global.it = vi.it;
global.expect = vi.expect;
global.beforeEach = vi.beforeEach;
global.afterEach = vi.afterEach;

// Mock Firebase
vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  push: vi.fn(),
  remove: vi.fn()
}));

// Mock Analytics
vi.mock('@/lib/firebase/services/analytics', () => ({
  analyticsService: {
    trackEvent: vi.fn(),
    trackError: vi.fn()
  }
}));

// Mock Cache
vi.mock('@/lib/cache', () => ({
  Cache: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
    delete: vi.fn()
  }))
}));