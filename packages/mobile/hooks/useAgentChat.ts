/**
 * Mobile-native version of useAgentChat.
 * Uses AsyncStorage instead of localStorage.
 * Shares core LLM logic from @nexus-hub/core.
 */
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Agent, ApiKeys, Message, INITIAL_AGENTS, callLLM } from '@nexus-hub/core';

const STORAGE_KEY = 'nexus-hub:history';
const KEYS_STORAGE_KEY = 'nexus-hub:apikeys';
const CUSTOM_AGENTS_KEY = 'nexus-hub:custom-agents';

const serializeHistory = (agents: Agent[]) =>
  agents.reduce<Record<string, { role: string; text: string; timestamp: string }[]>>(
    (acc, a) => {
      acc[a.id] = a.history.map((m) => ({ ...m, timestamp: m.timestamp.toISOString() }));
      return acc;
    },
    {}
  );

export const useAgentChat = () => {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [activeId, setActiveId] = useState<string>(INITIAL_AGENTS[0].id);
  const [apiKeys, setApiKeysState] = useState<ApiKeys>({ openrouter: '', groq: '' });
  const [isReady, setIsReady] = useState(false);

  // Hydrate from AsyncStorage on mount
  useEffect(() => {
    const hydrate = async () => {
      try {
        const [historyRaw, keysRaw, customRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(KEYS_STORAGE_KEY),
          AsyncStorage.getItem(CUSTOM_AGENTS_KEY),
        ]);

        const savedHistory: Record<string, Message[]> = historyRaw
          ? Object.fromEntries(
              Object.entries(
                JSON.parse(historyRaw) as Record<string, { role: string; text: string; timestamp: string }[]>
              ).map(([id, msgs]) => [
                id,
                msgs.map((m) => ({
                  ...m,
                  role: m.role as Message['role'],
                  timestamp: new Date(m.timestamp),
                })),
              ])
            )
          : {};

        const savedKeys: ApiKeys = keysRaw
          ? (JSON.parse(keysRaw) as ApiKeys)
          : { openrouter: '', groq: '' };

        const customAgents: Agent[] = customRaw
          ? (JSON.parse(customRaw) as Agent[]).map((a) => ({
              ...a,
              status: 'idle' as const,
              history: savedHistory[a.id] ?? a.history.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })),
            }))
          : [];

        const hydratedBase = INITIAL_AGENTS.map((a) =>
          savedHistory[a.id]?.length ? { ...a, history: savedHistory[a.id] } : a
        );

        setAgents([...hydratedBase, ...customAgents]);
        setApiKeysState(savedKeys);
      } catch {
        // start fresh on any error
      } finally {
        setIsReady(true);
      }
    };
    hydrate();
  }, []);

  // Persist history on agents change
  useEffect(() => {
    if (!isReady) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serializeHistory(agents)));
  }, [agents, isReady]);

  const setApiKeys = useCallback((keys: ApiKeys) => {
    setApiKeysState(keys);
    AsyncStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys));
  }, []);

  const activeAgent = agents.find((a) => a.id === activeId) ?? agents[0];

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
      AsyncStorage.setItem(CUSTOM_AGENTS_KEY, JSON.stringify(customs));
      return updated;
    });
    setActiveId(newAgent.id);
  }, []);

  const deleteAgent = useCallback(
    (id: string) => {
      setAgents((prev) => {
        const updated = prev.filter((a) => a.id !== id);
        const customs = updated.filter((a) => a.id.startsWith('custom-'));
        AsyncStorage.setItem(CUSTOM_AGENTS_KEY, JSON.stringify(customs));
        return updated;
      });
      if (activeId === id) setActiveId(INITIAL_AGENTS[0].id);
    },
    [activeId]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      const userMessage: Message = { role: 'user', text, timestamp: new Date() };

      setAgents((prev) =>
        prev.map((a) =>
          a.id === activeId ? { ...a, status: 'thinking', history: [...a.history, userMessage] } : a
        )
      );

      try {
        const agent = agents.find((a) => a.id === activeId)!;
        const responseText = await callLLM(agent, apiKeys, text);
        const agentMessage: Message = { role: 'agent', text: responseText, timestamp: new Date() };

        setAgents((prev) =>
          prev.map((a) =>
            a.id === activeId
              ? { ...a, status: 'idle', history: [...a.history, userMessage, agentMessage] }
              : a
          )
        );
      } catch (err: unknown) {
        const errorText = err instanceof Error ? err.message : 'Something went wrong.';
        const errorMessage: Message = { role: 'agent', text: `⚠️ ${errorText}`, timestamp: new Date() };
        setAgents((prev) =>
          prev.map((a) =>
            a.id === activeId
              ? { ...a, status: 'error', history: [...a.history, userMessage, errorMessage] }
              : a
          )
        );
      }
    },
    [activeId, agents, apiKeys]
  );

  const clearHistory = useCallback(() => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id !== activeId) return a;
        const initial = INITIAL_AGENTS.find((i) => i.id === a.id);
        const greeting: Message = {
          role: 'agent',
          text: initial
            ? initial.history[0].text
            : `${a.name} ready. How can I help?`,
          timestamp: new Date(),
        };
        return { ...a, history: [greeting] };
      })
    );
  }, [activeId]);

  return {
    agents,
    activeAgent,
    activeId,
    setActiveId,
    sendMessage,
    addAgent,
    deleteAgent,
    clearHistory,
    apiKeys,
    setApiKeys,
    isReady,
  };
};
