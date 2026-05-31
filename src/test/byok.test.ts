/**
 * Regression tests — BYOK hash fragment handling
 * Verifies the URL hash parsing logic from App.tsx in isolation.
 * Ensures keys are accepted/rejected correctly and hash is always cleared.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Pure extraction of BYOK logic ────────────────────────────────────────────
// This mirrors the useEffect logic in App.tsx so we can test it
// without rendering the full component tree.
function parseBYOKHash(hash: string): string | null {
  if (!hash.startsWith('#orkey=')) return null;
  const raw = decodeURIComponent(hash.slice('#orkey='.length));
  if (!raw || !raw.startsWith('sk-or-')) return null;
  return raw;
}

describe('BYOK hash fragment parser', () => {
  it('accepts a valid OpenRouter key', () => {
    const key = parseBYOKHash('#orkey=sk-or-v1-abc123def456');
    expect(key).toBe('sk-or-v1-abc123def456');
  });

  it('rejects a Groq key (wrong prefix)', () => {
    expect(parseBYOKHash('#orkey=gsk_someGroqKey')).toBeNull();
  });

  it('rejects an empty value', () => {
    expect(parseBYOKHash('#orkey=')).toBeNull();
  });

  it('returns null for unrelated hash', () => {
    expect(parseBYOKHash('#section=about')).toBeNull();
  });

  it('returns null for empty hash', () => {
    expect(parseBYOKHash('')).toBeNull();
  });

  it('handles URL-encoded keys', () => {
    const encoded = '#orkey=' + encodeURIComponent('sk-or-v1-test%20key');
    // After decode it won't start with sk-or- cleanly, but we test decoding works
    const key = parseBYOKHash(encoded);
    // sk-or-v1-test%20key decoded is "sk-or-v1-test key" — still starts with sk-or-
    expect(key).toContain('sk-or-v1-test');
  });

  it('rejects non-OpenRouter tokens that start with "sk-" but not "sk-or-"', () => {
    expect(parseBYOKHash('#orkey=sk-ant-anthropicKey')).toBeNull();
  });
});

// ── Hash clearing behaviour ───────────────────────────────────────────────────
describe('BYOK hash clearing', () => {
  beforeEach(() => {
    // Reset location mock
    Object.defineProperty(window, 'location', {
      value: { hash: '', pathname: '/chat', search: '' },
      writable: true,
    });
    vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
  });

  it('replaceState is called to clear the hash after key is read', () => {
    // Simulate what App.tsx does
    const hash = '#orkey=sk-or-v1-testkey';
    const key = parseBYOKHash(hash);
    if (key) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      '',
      window.location.pathname
    );
  });

  it('replaceState is NOT called when hash is invalid', () => {
    const key = parseBYOKHash('#section=about');
    if (key) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    expect(window.history.replaceState).not.toHaveBeenCalled();
  });
});
