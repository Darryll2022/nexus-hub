import { Agent, ModelOption } from '../types';

// ── Free model list — last verified 2026-05-31 ────────────────────────────────
// Check openrouter.ai/models?q=:free for updates when models 404.
export const FREE_MODELS: ModelOption[] = [
  // ── Groq (fast, no OR key needed) ────────────────────────────────────────
  { id: 'llama-3.1-8b-instant',       name: 'Llama 3.1 8B (Groq Fast)',        provider: 'groq' },
  { id: 'llama-3.3-70b-versatile',    name: 'Llama 3.3 70B (Groq Versatile)',  provider: 'groq' },
  // ── OpenRouter free ───────────────────────────────────────────────────────
  { id: 'meta-llama/llama-3.3-70b-instruct:free',  name: 'Llama 3.3 70B (OpenRouter free)',      provider: 'openrouter' },
  { id: 'google/gemma-4-31b-it:free',              name: 'Gemma 4 31B (OpenRouter free)',        provider: 'openrouter' },
  { id: 'moonshotai/kimi-k2.6:free',               name: 'Kimi K2.6 (OpenRouter free)',          provider: 'openrouter' },
  { id: 'nvidia/nemotron-3-super-120b-a12b:free',  name: 'Nemotron 120B (OpenRouter free)',      provider: 'openrouter' },
  { id: 'qwen/qwen3-coder:free',                   name: 'Qwen3 Coder 480B (OpenRouter free)',   provider: 'openrouter' },
  // ── OpenRouter paid ───────────────────────────────────────────────────────
  { id: 'meta-llama/llama-3.3-70b-instruct',       name: 'Llama 3.3 70B (OpenRouter)',          provider: 'openrouter' },
  { id: 'anthropic/claude-3.5-haiku',              name: 'Claude 3.5 Haiku (OpenRouter)',        provider: 'openrouter' },
  { id: 'google/gemini-2.0-flash-001',             name: 'Gemini 2.0 Flash (OpenRouter)',        provider: 'openrouter' },
];

export const INITIAL_AGENTS: Agent[] = [
  {
    id: '1',
    name: 'Blocker Buster',
    role: 'DevOps & Systems Tech Lead',
    iconName: 'Wrench',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    status: 'idle',
    model: 'llama-3.1-8b-instant',
    provider: 'groq',
    systemPrompt: `You are a veteran DevOps and Systems Tech Lead with 15+ years of experience. 
Your expertise: environment configurations, dependency resolution, package management, CI/CD pipelines, Docker, cloud infra, and system debugging.
When given an error log or environment issue: diagnose the root cause clearly, explain WHY it happened, then provide a numbered step-by-step fix.
Be concise but thorough. If you need more info, ask one focused question.`,
    history: [{ role: 'agent', text: 'Blocker Buster online. Paste your error log or describe the issue — I\'ll get you unblocked.', timestamp: new Date() }],
  },
  {
    id: '2',
    name: 'Atlas',
    role: 'Senior Code Reviewer',
    iconName: 'Terminal',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    status: 'idle',
    model: 'llama-3.3-70b-versatile',
    provider: 'groq',
    systemPrompt: `You are a senior software engineer with deep expertise in TypeScript, React, Node.js, and system design.
Review code with a focus on: correctness, performance, security vulnerabilities, maintainability, and adherence to SOLID principles.
Structure your reviews as: 
1. **Summary** — overall assessment
2. **Critical Issues** — bugs or security flaws (must fix)
3. **Improvements** — performance, readability, best practices
4. **Positives** — what was done well
Be direct and specific. Include code snippets for suggested fixes where relevant.`,
    history: [{ role: 'agent', text: 'Atlas ready. Paste your code or PR diff and I\'ll give you a thorough review.', timestamp: new Date() }],
  },
  {
    id: '3',
    name: 'Lyra',
    role: 'Deep Researcher',
    iconName: 'BookOpen',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    status: 'idle',
    model: 'nvidia/nemotron-3-super-120b-a12b:free',
    provider: 'openrouter',
    systemPrompt: `You are a meticulous research analyst and technical writer.
When given a research topic: provide comprehensive, structured analysis with clear sections.
Always: distinguish facts from inferences, cite sources when known, flag areas of uncertainty, and provide actionable takeaways.
Format responses with headers and bullet points for scannability. Prioritize depth over breadth — go deep on what matters most.`,
    history: [{ role: 'agent', text: 'Lyra here. What are we investigating today?', timestamp: new Date() }],
  },
  {
    id: '4',
    name: 'Sham',
    role: 'Portfolio & Nexus Hub Developer',
    iconName: 'Sparkles',
    color: 'text-violet-400',
    bgColor: 'bg-violet-400/10',
    status: 'idle',
    model: 'llama-3.3-70b-versatile',   // informational only — routed externally
    provider: 'external',
    systemPrompt: '',                    // system prompt lives server-side
    externalConfig: {
      endpoint: 'https://sham-f2a98ff3.base44.app/functions/shamChat',
      secret: '',  // loaded from ApiKeys.shamSecret (Configure panel) at runtime
    },
    history: [{ role: 'agent', text: "Sham here. I know your portfolio and Nexus Hub inside out — ask me anything.", timestamp: new Date() }],
  },
];
