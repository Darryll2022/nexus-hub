export type AgentStatus = 'idle' | 'thinking' | 'streaming' | 'error';
export type MessageRole = 'user' | 'agent';
export type ApiProvider = 'openrouter' | 'groq' | 'external';

/**
 * AgentType — 'llm' uses the Vercel AI SDK (Groq / OpenRouter).
 *             'opencode' routes through the local opencode server.
 * Defaults to 'llm' when absent — fully backwards compatible.
 */
export type AgentType = 'llm' | 'opencode';

export interface Message {
  role: MessageRole;
  text: string;
  timestamp: Date;
  /** True while the message is still being streamed in */
  streaming?: boolean;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  iconName: string;
  color: string;
  bgColor: string;
  status: AgentStatus;
  model: string;
  provider: ApiProvider;
  systemPrompt: string;
  history: Message[];
  /** Routing type — defaults to 'llm' if absent */
  type?: AgentType;
  /** Working directory passed to opencode session (opencode agents only) */
  opencodeDirectory?: string;
  /** Enable rich part rendering (Level 2) — defaults to false */
  richMode?: boolean;
  /** External API config — only used when provider === 'external' */
  externalConfig?: ExternalAgentConfig;
}

export interface ApiKeys {
  openrouter: string;
  groq: string;
  shamSecret: string;
}

/** Config for an external API agent (e.g. Sham endpoint) */
export interface ExternalAgentConfig {
  /** Full URL to the external chat endpoint */
  endpoint: string;
  /** Value sent as X-Agent-Secret header */
  secret: string;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: ApiProvider;
}
