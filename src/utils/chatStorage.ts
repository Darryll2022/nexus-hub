/**
 * chatStorage.ts
 * Pure localStorage helpers extracted from useAgentChat.ts for testability.
 * No React imports — safe to test in Node/jsdom without a component tree.
 */
import { Agent, ApiKeys, Message } from '../types';

export const STORAGE_KEY       = 'nexus-hub:history';
export const KEYS_STORAGE_KEY  = 'nexus-hub:apikeys';
export const CUSTOM_AGENTS_KEY = 'nexus-hub:custom-agents';

export const MAX_CONTEXT_MESSAGES = 20;
export const MAX_STORED_MESSAGES  = 100;
export const SEND_DEBOUNCE_MS     = 500;

// ── Serialise ──────────────────────────────────────────────────────────────
export const serializeHistory = (agents: Agent[]) =>
  agents.reduce<Record<string, { role: string; text: string; timestamp: string }[]>>(
    (acc, a) => {
      const capped = a.history.slice(-MAX_STORED_MESSAGES);
      acc[a.id] = capped.map((m) => ({
        role: m.role,
        text: m.text,
        timestamp: m.timestamp.toISOString(),
      }));
      return acc;
    },
    {}
  );

// ── Load history ───────────────────────────────────────────────────────────
export const loadHistory = (): Record<string, Message[]> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<
      string,
      { role: string; text: string; timestamp: string }[]
    >;
    return Object.fromEntries(
      Object.entries(parsed).map(([id, msgs]) => [
        id,
        msgs.map((m) => ({
          role: m.role as Message['role'],
          text: m.text,
          timestamp: new Date(m.timestamp),
        })),
      ])
    );
  } catch {
    console.warn('[nexus-hub] Failed to parse chat history — resetting.');
    return {};
  }
};

// ── Load API keys ──────────────────────────────────────────────────────────
export const loadApiKeys = (): ApiKeys => {
  try {
    const raw = localStorage.getItem(KEYS_STORAGE_KEY);
    if (!raw) return { openrouter: '', groq: '', shamSecret: '' };
    return JSON.parse(raw) as ApiKeys;
  } catch {
    console.warn('[nexus-hub] Failed to parse API keys — resetting.');
    return { openrouter: '', groq: '', shamSecret: '' };
  }
};
