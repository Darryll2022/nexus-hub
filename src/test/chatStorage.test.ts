/**
 * Unit tests — chatStorage helpers
 * Tests serialization, deserialization, and localStorage resilience.
 * No API calls. No tokens consumed.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  serializeHistory,
  loadHistory,
  loadApiKeys,
  STORAGE_KEY,
  KEYS_STORAGE_KEY,
  MAX_STORED_MESSAGES,
} from '../utils/chatStorage';
import type { Agent, Message } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────
const makeAgent = (id: string, messages: Message[]): Agent => ({
  id,
  name: 'Test Agent',
  role: 'Tester',
  iconName: 'Wrench',
  color: 'text-amber-400',
  bgColor: 'bg-amber-400/10',
  status: 'idle',
  model: 'llama-3.1-8b-instant',
  provider: 'groq',
  systemPrompt: 'Be helpful.',
  history: messages,
});

const makeMessage = (text: string, role: 'user' | 'agent' = 'user'): Message => ({
  role,
  text,
  timestamp: new Date('2026-05-31T12:00:00Z'),
});

// ── serializeHistory ─────────────────────────────────────────────────────────
describe('serializeHistory', () => {
  it('serializes a single agent with messages', () => {
    const agent = makeAgent('1', [makeMessage('hello'), makeMessage('world', 'agent')]);
    const result = serializeHistory([agent]);
    expect(result['1']).toHaveLength(2);
    expect(result['1'][0].text).toBe('hello');
    expect(result['1'][0].role).toBe('user');
    expect(typeof result['1'][0].timestamp).toBe('string'); // ISO string
  });

  it('caps messages at MAX_STORED_MESSAGES (100)', () => {
    const manyMessages = Array.from({ length: 150 }, (_, i) => makeMessage(`msg ${i}`));
    const agent = makeAgent('1', manyMessages);
    const result = serializeHistory([agent]);
    expect(result['1']).toHaveLength(MAX_STORED_MESSAGES);
    // Should keep the LAST 100, not the first
    expect(result['1'][0].text).toBe('msg 50');
    expect(result['1'][99].text).toBe('msg 149');
  });

  it('serializes multiple agents independently', () => {
    const a1 = makeAgent('1', [makeMessage('a1 message')]);
    const a2 = makeAgent('2', [makeMessage('a2 message')]);
    const result = serializeHistory([a1, a2]);
    expect(result['1'][0].text).toBe('a1 message');
    expect(result['2'][0].text).toBe('a2 message');
  });

  it('returns empty array for agent with no messages', () => {
    const agent = makeAgent('1', []);
    const result = serializeHistory([agent]);
    expect(result['1']).toHaveLength(0);
  });

  it('converts Date timestamps to ISO strings', () => {
    const agent = makeAgent('1', [makeMessage('test')]);
    const result = serializeHistory([agent]);
    expect(result['1'][0].timestamp).toBe('2026-05-31T12:00:00.000Z');
  });
});

// ── loadHistory ──────────────────────────────────────────────────────────────
describe('loadHistory', () => {
  it('returns empty object when localStorage is empty', () => {
    expect(loadHistory()).toEqual({});
  });

  it('deserializes stored history correctly', () => {
    const stored = {
      '1': [{ role: 'user', text: 'hello', timestamp: '2026-05-31T12:00:00.000Z' }],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    const result = loadHistory();
    expect(result['1']).toHaveLength(1);
    expect(result['1'][0].text).toBe('hello');
    expect(result['1'][0].timestamp).toBeInstanceOf(Date);
  });

  it('returns empty object and warns on corrupted JSON', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEY, 'NOT_VALID_JSON{{');
    const result = loadHistory();
    expect(result).toEqual({});
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to parse'));
    warnSpy.mockRestore();
  });

  it('handles multiple agents in stored history', () => {
    const stored = {
      '1': [{ role: 'user', text: 'from agent 1', timestamp: '2026-05-31T12:00:00.000Z' }],
      '2': [{ role: 'agent', text: 'from agent 2', timestamp: '2026-05-31T12:00:00.000Z' }],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    const result = loadHistory();
    expect(result['1'][0].text).toBe('from agent 1');
    expect(result['2'][0].role).toBe('agent');
  });
});

// ── loadApiKeys ──────────────────────────────────────────────────────────────
describe('loadApiKeys', () => {
  it('returns empty keys when localStorage is empty', () => {
    expect(loadApiKeys()).toEqual({ openrouter: '', groq: '', shamSecret: '' });
  });

  it('loads stored keys correctly', () => {
    const keys = { openrouter: 'sk-or-test', groq: 'gsk_test', shamSecret: 'abc123' };
    localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys));
    expect(loadApiKeys()).toEqual(keys);
  });

  it('returns empty keys and warns on corrupted JSON', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem(KEYS_STORAGE_KEY, '{bad json');
    const result = loadApiKeys();
    expect(result).toEqual({ openrouter: '', groq: '', shamSecret: '' });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to parse'));
    warnSpy.mockRestore();
  });

  it('handles partial key objects gracefully', () => {
    localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify({ groq: 'gsk_only' }));
    const result = loadApiKeys();
    // Should at least have the groq key without throwing
    expect(result.groq).toBe('gsk_only');
  });
});
