import { useState, useCallback, useEffect, useRef } from 'react';
import { createGroq } from '@ai-sdk/groq';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';
import { Agent, ApiKeys, Message } from './types';
import { INITIAL_AGENTS } from './agents';

const STORAGE_KEY        = 'nexus-hub:history';
const KEYS_STORAGE_KEY   = 'nexus-hub:apikeys';
const CUSTOM_AGENTS_KEY  = 'nexus-hub:custom-agents';

// H3: Hard caps — context window sent to API, and localStorage ring-buffer
const MAX_CONTEXT_MESSAGES = 20;   // messages sent to LLM per turn
const MAX_STORED_MESSAGES  = 100;  // messages retained in localStorage per agent

// H2: Minimum ms between sends (guards against double-tap / programmatic spam)
const SEND_DEBOUNCE_MS = 500;

// ─── Persistence helpers ─────────────────────────────────────────────────────

const serializeHistory = (agents: Agent[]) =>
  agents.reduce<Record<string, { role: string; text: string; timestamp: string }[]>>(
    (acc, a) => {
      // H3: Only persist the last MAX_STORED_MESSAGES per agent
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

const loadHistory = (): Record<string, Message[]> => {
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
    // L1: Surface storage corruption rather than silently swallowing
    console.warn('[nexus-hub] Failed to parse chat history from localStorage — resetting.');
    return {};
  }
};

const loadApiKeys = (): ApiKeys => {
  try {
    const raw = localStorage.getItem(KEYS_STORAGE_KEY);
    if (!raw) return { openrouter: '', groq: '' };
    return JSON.parse(raw) as ApiKeys;
  } catch {
    console.warn('[nexus-hub] Failed to parse API keys from localStorage — resetting.');
    return { openrouter: '', groq: '' };
  }
};

const loadCustomAgents = (): Agent[] => {
  try {
    const raw = localStorage.getItem(CUSTOM_AGENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Agent[];
    const savedHistory = loadHistory();
    return parsed.map((a) => ({
      ...a,
      status: 'idle' as const,
      history: savedHistory[a.id] ?? a.history.map((m) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
    }));
  } catch {
    console.warn('[nexus-hub] Failed to parse custom agents from localStorage — resetting.');
    return [];
  }
};

const hydrateAgents = (base: Agent[]): Agent[] => {
  const saved = loadHistory();
  return base.map((a) =>
    saved[a.id] && saved[a.id].length > 0 ? { ...a, history: saved[a.id] } : a
  );
};

// ─── Provider factory ────────────────────────────────────────────────────────

function getModel(agent: Agent, keys: ApiKeys) {
  if (agent.provider === 'groq') {
    if (!keys.groq) throw new Error(
      `No Groq API key. Open Configure (⚙) and enter your Groq key.`
    );
    return createGroq({ apiKey: keys.groq })(agent.model);
  }
  if (!keys.openrouter) throw new Error(
    `No OpenRouter API key. Open Configure (⚙) and enter your OpenRouter key.`
  );
  return createOpenRouter({ apiKey: keys.openrouter })(agent.model);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useAgentChat = () => {
  const [agents, setAgents] = useState<Agent[]>(() => [
    ...hydrateAgents(INITIAL_AGENTS),
    ...loadCustomAgents(),
  ]);
  const [activeId, setActiveId] = useState<string>(INITIAL_AGENTS[0].id);
  const [apiKeys, setApiKeysState] = useState<ApiKeys>(loadApiKeys);

  // H2: Guards against double-send and programmatic spam
  const sendingRef  = useRef(false);
  const lastSentRef = useRef(0);

  // Abort controller — cancels in-flight stream
  const abortRef = useRef<AbortController | null>(null);

  // Persist history whenever agents change (skip in-flight streaming messages)
  useEffect(() => {
    const stable = agents.map((a) => ({
      ...a,
      history: a.history.filter((m) => !m.streaming),
    }));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeHistory(stable)));
    } catch {
      console.warn('[nexus-hub] localStorage write failed — storage may be full.');
    }
  }, [agents]);

  const setApiKeys = useCallback((keys: ApiKeys) => {
    setApiKeysState(keys);
    try {
      localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys));
    } catch {
      console.warn('[nexus-hub] Failed to persist API keys.');
    }
  }, []);

  const activeAgent = agents.find((a) => a.id === activeId) ?? agents[0];

  // ── addAgent ──────────────────────────────────────────────────────────────
  const addAgent = useCallback((agentDef: Omit<Agent, 'status' | 'history'>) => {
    const greeting: Message = {
      role: 'agent',
      text: `${agentDef.name} ready. How can I help?`,
      timestamp: new Date(),
    };
    const newAgent: Agent = { ...agentDef, status: 'idle', history: [greeting] };

    setAgents((prev) => {
      const updated = [...prev, newAgent];
      const customs = updated.filter((a) => a.id.startsWith('custom-'));
      try { localStorage.setItem(CUSTOM_AGENTS_KEY, JSON.stringify(customs)); } catch {}
      return updated;
    });
    setActiveId(newAgent.id);
  }, []);

  // ── deleteAgent ───────────────────────────────────────────────────────────
  const deleteAgent = useCallback(
    (id: string) => {
      setAgents((prev) => {
        const updated = prev.filter((a) => a.id !== id);
        const customs = updated.filter((a) => a.id.startsWith('custom-'));
        try { localStorage.setItem(CUSTOM_AGENTS_KEY, JSON.stringify(customs)); } catch {}
        return updated;
      });
      if (activeId === id) setActiveId(INITIAL_AGENTS[0].id);
    },
    [activeId]
  );

  // ── sendMessage ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      // H2: Send lock — blocks overlapping sends
      if (sendingRef.current) return;

      // H2: Debounce — minimum 500ms between sends
      const now = Date.now();
      if (now - lastSentRef.current < SEND_DEBOUNCE_MS) return;
      lastSentRef.current = now;

      sendingRef.current = true;

      // Cancel any previous in-flight stream
      abortRef.current?.abort();
      const abort = new AbortController();
      abortRef.current = abort;

      const userMessage: Message = { role: 'user', text, timestamp: new Date() };
      const streamingMsg: Message = {
        role: 'agent',
        text: '',
        timestamp: new Date(),
        streaming: true,
      };

      setAgents((prev) =>
        prev.map((a) =>
          a.id === activeId
            ? {
                ...a,
                status: 'streaming',
                history: [...a.history, userMessage, streamingMsg],
              }
            : a
        )
      );

      try {
        const agent = agents.find((a) => a.id === activeId)!;
        const model = getModel(agent, apiKeys);

        // H3: Only send last MAX_CONTEXT_MESSAGES to the API
        const history = agent.history
          .slice(-MAX_CONTEXT_MESSAGES)
          .filter((m) => !m.streaming);

        const sdkMessages = [
          ...history.map((m) => ({
            role: (m.role === 'agent' ? 'assistant' : 'user') as 'user' | 'assistant',
            content: m.text,
          })),
          { role: 'user' as const, content: text },
        ];

        const result = streamText({
          model,
          system: agent.systemPrompt,
          messages: sdkMessages,
          temperature: 0.7,
          abortSignal: abort.signal,
        });

        let accumulated = '';
        for await (const chunk of result.textStream) {
          if (abort.signal.aborted) break;
          accumulated += chunk;
          const snapshot = accumulated;
          setAgents((prev) =>
            prev.map((a) =>
              a.id === activeId
                ? {
                    ...a,
                    history: a.history.map((m) =>
                      m.streaming ? { ...m, text: snapshot } : m
                    ),
                  }
                : a
            )
          );
        }

        setAgents((prev) =>
          prev.map((a) =>
            a.id === activeId
              ? {
                  ...a,
                  status: 'idle',
                  history: a.history.map((m) =>
                    m.streaming ? { ...m, streaming: false } : m
                  ),
                }
              : a
          )
        );
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          sendingRef.current = false;
          return;
        }
        const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
        setAgents((prev) =>
          prev.map((a) =>
            a.id === activeId
              ? {
                  ...a,
                  status: 'error',
                  history: a.history.map((m) =>
                    m.streaming
                      ? { ...m, streaming: false, text: `⚠️ ${errorMsg}` }
                      : m
                  ),
                }
              : a
          )
        );
      } finally {
        sendingRef.current = false;
      }
    },
    [activeId, agents, apiKeys]
  );

  // ── stopStream ────────────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    setAgents((prev) =>
      prev.map((a) =>
        a.id === activeId
          ? {
              ...a,
              status: 'idle',
              history: a.history.map((m) =>
                m.streaming ? { ...m, streaming: false } : m
              ),
            }
          : a
      )
    );
  }, [activeId]);

  // ── updateAgent ───────────────────────────────────────────────────────────
  const updateAgent = useCallback((id: string, updates: Partial<Agent>) => {
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  }, []);

  // ── clearHistory ──────────────────────────────────────────────────────────
  const clearHistory = useCallback((id: string) => {
    const base = INITIAL_AGENTS.find((ia) => ia.id === id);
    const greeting: Message = base
      ? base.history[0]
      : { role: 'agent', text: 'Ready. How can I help?', timestamp: new Date() };

    setAgents((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, history: [greeting], status: 'idle' } : a
      )
    );
  }, []);

  return {
    agents,
    activeAgent,
    activeId,
    setActiveId,
    apiKeys,
    setApiKeys,
    sendMessage,
    stopStream,
    updateAgent,
    clearHistory,
    addAgent,
    deleteAgent,
  };
};
