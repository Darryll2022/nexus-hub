import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';

// Reset localStorage between every test so state never leaks
afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
