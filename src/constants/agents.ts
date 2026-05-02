import { Agent, ModelOption } from '../types';

export const FREE_MODELS: ModelOption[] = [
  { id: 'meta-llama/llama-3-8b-instruct:free', name: 'Llama 3 8B (OpenRouter Free)', provider: 'openrouter' },
  { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B (OpenRouter Free)', provider: 'openrouter' },
  { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B (OpenRouter Free)', provider: 'openrouter' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (OpenRouter Free)', provider: 'openrouter' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Groq Fast)', provider: 'groq' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq Versatile)', provider: 'groq' },
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
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    provider: 'openrouter',
    systemPrompt: `You are a meticulous research analyst and technical writer.
When given a research topic: provide comprehensive, structured analysis with clear sections.
Always: distinguish facts from inferences, cite sources when known, flag areas of uncertainty, and provide actionable takeaways.
Format responses with headers and bullet points for scannability. Prioritize depth over breadth — go deep on what matters most.`,
    history: [{ role: 'agent', text: 'Lyra here. What are we investigating today?', timestamp: new Date() }],
  },
];
