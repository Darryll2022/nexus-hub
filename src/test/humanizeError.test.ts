/**
 * Unit tests — humanizeError()
 * Tests the error message humanizer that converts raw API errors
 * into readable strings shown to the user in the chat area.
 */
import { describe, it, expect } from 'vitest';
import { humanizeError } from '../utils/humanizeError';

describe('humanizeError', () => {
  // ── Non-Error inputs ─────────────────────────────────────────────────────
  it('returns fallback for non-Error input (string)', () => {
    expect(humanizeError('raw string')).toBe('Unknown error occurred.');
  });

  it('returns fallback for null', () => {
    expect(humanizeError(null)).toBe('Unknown error occurred.');
  });

  it('returns fallback for undefined', () => {
    expect(humanizeError(undefined)).toBe('Unknown error occurred.');
  });

  // ── Groq rate-limit errors ───────────────────────────────────────────────
  it('humanizes a Groq rate-limit error with resetsAt timestamp', () => {
    // resetsAt: a fixed epoch for predictable output
    const resetsAt = 1779091800; // some future timestamp
    const err = new Error(
      `Request failed: {"type":"exceeded_limit","resetsAt":${resetsAt}}`
    );
    const result = humanizeError(err);
    expect(result).toContain('Rate limit reached');
    expect(result).toContain('SGT');
  });

  it('humanizes a Groq rate-limit error without resetsAt', () => {
    const err = new Error('{"type":"exceeded_limit"}');
    expect(humanizeError(err)).toBe('Rate limit reached. Please wait before sending again.');
  });

  it('handles exceeded_limit via status field (alternate Groq format)', () => {
    const err = new Error('{"status":"exceeded_limit"}');
    expect(humanizeError(err)).toBe('Rate limit reached. Please wait before sending again.');
  });

  // ── OpenRouter / Vercel AI SDK errors ────────────────────────────────────
  it('strips AI_APICallError prefix from OpenRouter errors', () => {
    const err = new Error('AI_APICallError: No endpoints found for mistralai/mistral-7b-instruct:free.');
    expect(humanizeError(err)).toBe('No endpoints found for mistralai/mistral-7b-instruct:free.');
  });

  it('strips Error: prefix from generic errors', () => {
    const err = new Error('Error: No Groq API key. Open Configure (⚙) and enter your Groq key.');
    const result = humanizeError(err);
    expect(result).not.toMatch(/^Error:/);
    expect(result).toContain('No Groq API key');
  });

  it('extracts message from nested error JSON', () => {
    const err = new Error('{"error":{"message":"Invalid API key"}}');
    expect(humanizeError(err)).toBe('Invalid API key');
  });

  it('extracts top-level message from error JSON', () => {
    const err = new Error('{"message":"You have exceeded your daily limit"}');
    expect(humanizeError(err)).toBe('You have exceeded your daily limit');
  });

  // ── Edge cases ────────────────────────────────────────────────────────────
  it('returns fallback when Error message is empty', () => {
    expect(humanizeError(new Error(''))).toBe('An unexpected error occurred.');
  });

  it('passes through a plain readable error unchanged', () => {
    const err = new Error('Network request failed');
    expect(humanizeError(err)).toBe('Network request failed');
  });

  it('does not throw on malformed JSON embedded in message', () => {
    const err = new Error('Something went wrong: {not valid json}');
    expect(() => humanizeError(err)).not.toThrow();
  });
});
