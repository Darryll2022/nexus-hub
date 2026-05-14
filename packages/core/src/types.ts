export type AgentStatus = 'idle' | 'thinking' | 'streaming' | 'error';
export type MessageRole = 'user' | 'agent';
export type ApiProvider = 'openrouter' | 'groq';

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
}

export interface ApiKeys {
  openrouter: string;
  groq: string;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: ApiProvider;
}
