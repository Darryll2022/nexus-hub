import { useState, useCallback } from 'react';
import { Agent, ApiKeys, Message } from '../types';
import { INITIAL_AGENTS } from '../constants/agents';

const getApiEndpoint = (provider: string) =>
  provider === 'groq'
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://openrouter.ai/api/v1/chat/completions';

const getApiKey = (provider: string, keys: ApiKeys): string => {
  if (provider === 'groq') return keys.groq || import.meta.env.VITE_GROQ_API_KEY || '';
  return keys.openrouter || import.meta.env.VITE_OPENROUTER_API_KEY || '';
};

export const useAgentChat = () => {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [activeId, setActiveId] = useState<string>(INITIAL_AGENTS[0].id);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ openrouter: '', groq: '' });

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
            `No API key found for ${agent.provider}. Add VITE_${agent.provider.toUpperCase()}_API_KEY to your .env.local or enter it in Settings.`
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
        a.id === id ? { ...a, history: [a.history[0]], status: 'idle' } : a
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
