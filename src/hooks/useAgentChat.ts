import { useState, useCallback, useEffect, useRef } from 'react';
import { createGroq } from '@ai-sdk/groq';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';
import { Agent, ApiKeys, Message } from '../types';
import { INITIAL_AGENTS, FREE_MODELS } from '../constants/agents';

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
    console.warn('[nexus-hub] Failed to parse chat history from localStorage — resetting.');
    return {};
  }
};

const loadApiKeys = (): ApiKeys => {
  try {
    const raw = localStorage.getItem(KEYS_STORAGE_KEY);
    if (!raw) return { openrouter: '', groq: '', shamSecret: '' };
    return JSON.parse(raw) as ApiKeys;
  } catch {
    console.warn('[nexus-hub] Failed to parse API keys from localStorage — resetting.');
    return { openrouter: '', groq: '', shamSecret: '' };
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

// ─── Free model fallback chain ────────────────────────────────────────────────
// Ordered list of OpenRouter :free models to try when the primary 429s.
// When a :free model rate-limits, we auto-retry with the next one in the chain
// and surface a soft notice rather than a hard error.
const OR_FREE_FALLBACK_CHAIN = FREE_MODELS
  .filter((m) => m.provider === 'openrouter' && m.id.endsWith(':free'))
  .map((m) => m.id);

// Groq fallback chain — if the assigned model rate-limits, flip to the other.
// 8B is fast (Blocker Buster default); 70B is powerful (Atlas default).
// On 429, each falls back to the other so the agent stays usable.
const GROQ_FALLBACK_CHAIN = FREE_MODELS
  .filter((m) => m.provider === 'groq')
  .map((m) => m.id);

function is429(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  // OpenRouter surfaces 429s as a provider error with code 429 in the message
  return msg.includes('429') || msg.includes('rate-limit') || msg.includes('rate_limit')
    || msg.includes('provider returned error') || msg.includes('temporarily rate-limited');
}

// ─── Error Humanizer ──────────────────────────────────────────────────────────
function humanizeError(err: unknown, fallbacksExhausted = false): string {
  if (!(err instanceof Error)) return 'Unknown error occurred.';

  // If we've exhausted all free fallbacks, give a clearer message
  if (fallbacksExhausted) {
    return 'All free OpenRouter models are currently rate-limited. Try again in a minute, or switch to a paid model in Configure (⚙).';
  }

  const raw = err.message;

  const jsonStart = raw.indexOf('{');
  if (jsonStart >= 0) {
    try {
      const firstJson = raw.slice(jsonStart).split('\n')[0].replace(/,$/, '');
      const parsed = JSON.parse(firstJson);

      if (parsed.type === 'exceeded_limit' || parsed.status === 'exceeded_limit') {
        const resetsAt: number = parsed.resetsAt ?? parsed.resets_at;
        if (resetsAt) {
          const resetDate = new Date(resetsAt * 1000);
          const formatted = resetDate.toLocaleString('en-SG', {
            timeZone: 'Asia/Singapore',
            dateStyle: 'medium',
            timeStyle: 'short',
          });
          return `Rate limit reached. Groq quota resets at ${formatted} (SGT). Try again then, or enter a paid key.`;
        }
        return 'Rate limit reached. Please wait before sending again.';
      }

      if (parsed.error?.message) return parsed.error.message;
      if (parsed.message) return parsed.message;
    } catch {
      // not JSON — fall through
    }
  }

  const cleaned = raw
    .replace(/^AI_APICallError:\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .trim();

  return cleaned || 'An unexpected error occurred.';
}

// ─── Provider factory ─────────────────────────────────────────────────────────
const OPENROUTER_APP_URL  = 'https://nexus-hub.vercel.app';
const OPENROUTER_APP_NAME = 'Nexus Hub';

function getModel(agent: Agent, keys: ApiKeys, modelOverride?: string) {
  const modelId = modelOverride ?? agent.model;
  if (agent.provider === 'groq') {
    if (!keys.groq) throw new Error(
      `No Groq API key. Open Configure (⚙) and enter your Groq key.`
    );
    return createGroq({ apiKey: keys.groq })(modelId);
  }
  if (!keys.openrouter) throw new Error(
    `No OpenRouter API key. Open Configure (⚙) and enter your OpenRouter key.`
  );
  return createOpenRouter({
    apiKey:  keys.openrouter,
    appUrl:  OPENROUTER_APP_URL,
    appName: OPENROUTER_APP_NAME,
  })(modelId);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

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

  // RCA-002: Stale-closure fix
  const apiKeysRef  = useRef<ApiKeys>(apiKeys);
  const activeIdRef = useRef<string>(activeId);

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

  apiKeysRef.current  = apiKeys;
  activeIdRef.current = activeId;

  const activeAgent = agents.find((a) => a.id === activeId) ?? agents[0];

  // ── addAgent ───────────────────────────────────────────────────────────────
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

  // ── deleteAgent ────────────────────────────────────────────────────────────
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

  // ── sendMessage ────────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      if (sendingRef.current) return;

      const now = Date.now();
      if (now - lastSentRef.current < SEND_DEBOUNCE_MS) return;
      lastSentRef.current = now;

      sendingRef.current = true;

      const currentKeys     = apiKeysRef.current;
      const currentActiveId = activeIdRef.current;

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
          a.id === currentActiveId
            ? {
                ...a,
                status: 'streaming',
                history: [...a.history, userMessage, streamingMsg],
              }
            : a
        )
      );

      try {
        const agent = agents.find((a) => a.id === currentActiveId)!;

        // ── External agent (Sham) ────────────────────────────────────────────
        if (agent.provider === 'external') {
          const cfg = agent.externalConfig;
          if (!cfg?.endpoint || !cfg?.secret) {
            throw new Error('External agent is missing endpoint or secret configuration.');
          }

          const history = agent.history
            .slice(-MAX_CONTEXT_MESSAGES)
            .filter((m) => !m.streaming);

          const messages = [
            ...history.map((m) => ({
              role: (m.role === 'agent' ? 'assistant' : 'user') as 'user' | 'assistant',
              content: m.text,
            })),
            { role: 'user' as const, content: text },
          ];

          const agentSecret = currentKeys.shamSecret || cfg.secret;
          if (!agentSecret) {
            throw new Error('Sham secret not configured. Open Configure (⚙) and enter your Sham Secret.');
          }
          const extRes = await fetch(cfg.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Agent-Secret': agentSecret,
            },
            body: JSON.stringify({ messages }),
            signal: abort.signal,
          });

          if (!extRes.ok) {
            const errJson = await extRes.json().catch(() => ({}));
            throw new Error((errJson as { error?: string }).error ?? `External API error ${extRes.status}`);
          }

          const reply = await extRes.json() as { role: string; content: string };

          setAgents((prev) =>
            prev.map((a) =>
              a.id === currentActiveId
                ? {
                    ...a,
                    status: 'idle',
                    history: a.history.map((m) =>
                      m.streaming
                        ? { ...m, streaming: false, text: reply.content }
                        : m
                    ),
                  }
                : a
            )
          );
          return;
        }

        // ── Standard LLM agents (Groq / OpenRouter) with free-tier fallback ──
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

        const MAX_SYSTEM_PROMPT = 2000;
        const safeSystemPrompt = agent.systemPrompt.slice(0, MAX_SYSTEM_PROMPT);

        // Build the model attempt list.
        // OR :free  → try assigned model first, then cycle through OR_FREE_FALLBACK_CHAIN.
        // Groq      → try assigned model first, then the other Groq model.
        // Paid OR / external → single attempt (no free fallback to try).
        const isOrFree  = agent.provider === 'openrouter' && agent.model.endsWith(':free');
        const isGroq    = agent.provider === 'groq';
        const modelAttempts: string[] = isOrFree
          ? [agent.model, ...OR_FREE_FALLBACK_CHAIN.filter((id) => id !== agent.model)]
          : isGroq
          ? [agent.model, ...GROQ_FALLBACK_CHAIN.filter((id) => id !== agent.model)]
          : [agent.model];

        let lastErr: unknown = null;
        let succeeded = false;

        for (const modelId of modelAttempts) {
          if (abort.signal.aborted) break;
          try {
            const model = getModel(agent, currentKeys, modelId);

            // Show which fallback we're using (soft notice in streaming bubble)
            if (modelId !== agent.model) {
              const notice = `⚡ Rate-limited on "${agent.model}" — retrying with ${modelId}…\n\n`;
              setAgents((prev) =>
                prev.map((a) =>
                  a.id === currentActiveId
                    ? {
                        ...a,
                        history: a.history.map((m) =>
                          m.streaming ? { ...m, text: notice } : m
                        ),
                      }
                    : a
                )
              );
            }

            const result = streamText({
              model,
              system: safeSystemPrompt,
              messages: sdkMessages,
              temperature: 0.7,
              abortSignal: abort.signal,
            });

            let accumulated = modelId !== agent.model
              ? `⚡ *Rate-limited — using fallback: ${modelId}*\n\n`
              : '';

            for await (const chunk of result.textStream) {
              if (abort.signal.aborted) break;
              accumulated += chunk;
              const snapshot = accumulated;
              setAgents((prev) =>
                prev.map((a) =>
                  a.id === currentActiveId
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
                a.id === currentActiveId
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

            succeeded = true;
            break; // ✅ success — stop trying fallbacks
          } catch (err) {
            lastErr = err;
            if (!is429(err)) break; // non-429 error → don't try next model, surface it
            // 429 → loop continues to next fallback model
          }
        }

        if (!succeeded && !abort.signal.aborted) {
          throw lastErr; // re-throw for the outer catch to handle
        }

      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          sendingRef.current = false;
          return;
        }
        // Check if we exhausted the full fallback chain
        const exhausted = is429(err);
        const errorMsg = humanizeError(err, exhausted);
        setAgents((prev) =>
          prev.map((a) =>
            a.id === currentActiveId
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

  // ── stopStream ─────────────────────────────────────────────────────────────
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

  // ── updateAgent ────────────────────────────────────────────────────────────
  const updateAgent = useCallback((id: string, updates: Partial<Agent>) => {
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  }, []);

  // ── clearConversation ──────────────────────────────────────────────────────
  const clearConversation = useCallback((id: string) => {
    const agent = agents.find((a) => a.id === id);
    if (!agent) return;
    const greeting: Message = {
      role: 'agent',
      text: agent.history[0]?.text ?? `${agent.name} ready.`,
      timestamp: new Date(),
    };
    setAgents((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, history: [greeting], status: 'idle' } : a
      )
    );
  }, [agents]);

  // ── resetAllStreams ────────────────────────────────────────────────────────
  const resetAllStreams = useCallback(() => {
    abortRef.current?.abort();
    setAgents((prev) =>
      prev.map((a) => ({
        ...a,
        status: 'idle',
        history: a.history.map((m) =>
          m.streaming ? { ...m, streaming: false, text: '⚠️ Session reset.' } : m
        ),
      }))
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
    addAgent,
    deleteAgent,
    updateAgent,
    clearConversation,
    resetAllStreams,
  };
};
