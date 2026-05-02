import { Key, Trash2 } from 'lucide-react';
import { Agent, ApiKeys } from '../types';
import { FREE_MODELS } from '../constants/agents';

interface Props {
  agent: Agent;
  apiKeys: ApiKeys;
  onUpdateAgent: (id: string, updates: Partial<Agent>) => void;
  onUpdateKeys: (keys: ApiKeys) => void;
  onClearHistory: (id: string) => void;
}

export const SettingsPanel = ({ agent, apiKeys, onUpdateAgent, onUpdateKeys, onClearHistory }: Props) => (
  <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col overflow-y-auto shrink-0">
    <div className="p-4 border-b border-slate-800">
      <h3 className="font-semibold text-white text-sm">Configure Agent</h3>
      <p className="text-xs text-slate-400 mt-1">{agent.name}</p>
    </div>

    <div className="p-4 space-y-5 flex-1">
      {/* API Keys */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Key size={14} className="text-slate-400" />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">API Keys</p>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Keys are stored in memory only. For persistence, set them in <code className="text-indigo-400">.env.local</code>.
        </p>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">OpenRouter Key</label>
            <input
              type="password"
              placeholder="sk-or-..."
              value={apiKeys.openrouter}
              onChange={(e) => onUpdateKeys({ ...apiKeys, openrouter: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-600 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Groq Key</label>
            <input
              type="password"
              placeholder="gsk_..."
              value={apiKeys.groq}
              onChange={(e) => onUpdateKeys({ ...apiKeys, groq: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-600 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Model Selection */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Model</p>
        <select
          value={agent.model}
          onChange={(e) => {
            const selected = FREE_MODELS.find((m) => m.id === e.target.value);
            if (selected) onUpdateAgent(agent.id, { model: selected.id, provider: selected.provider });
          }}
          className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {FREE_MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* System Prompt */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">System Prompt</p>
        <textarea
          value={agent.systemPrompt}
          onChange={(e) => onUpdateAgent(agent.id, { systemPrompt: e.target.value })}
          rows={8}
          className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
        />
      </div>

      {/* Danger Zone */}
      <div className="pt-2 border-t border-slate-800">
        <button
          onClick={() => onClearHistory(agent.id)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition-colors"
        >
          <Trash2 size={13} />
          Clear Conversation
        </button>
      </div>
    </div>
  </div>
);
