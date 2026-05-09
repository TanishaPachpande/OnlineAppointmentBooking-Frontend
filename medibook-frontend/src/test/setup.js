import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Setup localStorage mock for jsdom
if (globalThis.localStorage === undefined) {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  globalThis.localStorage = localStorageMock;
}