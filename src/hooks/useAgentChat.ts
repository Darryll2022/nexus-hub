import { useState, useCallback, useEffect } from 'react';
import { Agent, ApiKeys, Message } from '../types';
import { INITIAL_AGENTS } from '../constants/agents';

const STORAGE_KEY = 'nexus-hub:history';
const KEYS_STORAGE_KEY = 'nexus-hub:apikeys';

const getApiEndpoint = (provider: string) =>
  provider === 'groq'
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://openrouter.ai/api/v1/chat/completions';

const getApiKey = (provider: string, keys: ApiKeys): string => {
  if (provider === 'groq') return keys.groq || import.meta.env.VITE_GROQ_API_KEY || '';
  return keys.openrouter || import.meta.env.VITE_OPENROUTER_API_KEY || '';
};

// Serialize/deserialize Message dates
const serializeHistory = (agents: Agent[]) =>
  agents.reduce<Record<string, { role: string; text: string; timestamp: string }[]>>(
    (acc, a) => {
      acc[a.id] = a.history.map((m) => ({
        ...m,
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
          ...m,
          role: m.role as Message['role'],
          timestamp: new Date(m.timestamp),
        })),
      ])
    );
  } catch {
    return {};
  }
};

const loadApiKeys = (): ApiKeys => {
  try {
    const raw = localStorage.getItem(KEYS_STORAGE_KEY);
    if (!raw) return { openrouter: '', groq: '' };
    return JSON.parse(raw) as ApiKeys;
  } catch {
    return { openrouter: '', groq: '' };
  }
};

const hydrateAgents = (base: Agent[]): Agent[] => {
  const saved = loadHistory();
  return base.map((a) =>
    saved[a.id] && saved[a.id].length > 0 ? { ...a, history: saved[a.id] } : a
  );
};

export const useAgentChat = () => {
  const [agents, setAgents] = useState<Agent[]>(() => hydrateAgents(INITIAL_AGENTS));
  const [activeId, setActiveId] = useState<string>(INITIAL_AGENTS[0].id);
  const [apiKeys, setApiKeysState] = useState<ApiKeys>(loadApiKeys);

  // Persist history whenever agents change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeHistory(agents)));
  }, [agents]);

  const setApiKeys = useCallback((keys: ApiKeys) => {
    setApiKeysState(keys);
    // Only persist non-sensitive structure — actual key values are stored as-is
    // (user chose runtime entry, .env.local is the secure path)
    localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys));
  }, []);

  const activeAgent = agents.find((a) => a.id === activeId)!;

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMessage: Message = { role: 'user', text, timestamp: new Date() };

      setAgents((prev) =>
        prev.map((a) =>
          a.id === activeId
            ? { ...a, status: 'thinking', history: [...a.history, userMessage] }
            : a
        )
      );

      try {
        const agent = agents.find((a) => a.id === activeId)!;
        const apiKey = getApiKey(agent.provider, apiKeys);

        if (!apiKey) {
          throw new Error(
            `No API key for ${agent.provider}. Add VITE_${agent.provider.toUpperCase()}_API_KEY to .env.local or enter it in Configure.`
          );
        }

        const messages = [
          { role: 'system', content: agent.systemPrompt },
          ...agent.history.map((m) => ({
            role: m.role === 'agent' ? 'assistant' : 'user',
            content: m.text,
          })),
          { role: 'user', content: text },
        ];

        const res = await fetch(getApiEndpoint(agent.provider), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.href,
            'X-Title': 'Nexus Hub',
          },
          body: JSON.stringify({ model: agent.model, messages, temperature: 0.7 }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error?.message || `API error ${res.status}`);
        }

        const data = await res.json();
        const replyText: string = data.choices[0].message.content;
        const agentMessage: Message = { role: 'agent', text: replyText, timestamp: new Date() };

        setAgents((prev) =>
          prev.map((a) =>
            a.id === activeId
              ? { ...a, status: 'idle', history: [...a.history, agentMessage] }
              : a
          )
        );
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
        const errorMessage: Message = {
          role: 'agent',
          text: `⚠️ ${errorMsg}`,
          timestamp: new Date(),
        };
        setAgents((prev) =>
          prev.map((a) =>
            a.id === activeId
              ? { ...a, status: 'error', history: [...a.history, errorMessage] }
              : a
          )
        );
      }
    },
    [activeId, agents, apiKeys]
  );

  const updateAgent = useCallback((id: string, updates: Partial<Agent>) => {
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  }, []);

  const clearHistory = useCallback((id: string) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, history: [INITIAL_AGENTS.find((ia) => ia.id === id)!.history[0]], status: 'idle' }
          : a
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
    updateAgent,
    clearHistory,
  };
};
