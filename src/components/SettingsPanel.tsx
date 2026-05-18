import { useState } from 'react';
import { Eye, EyeOff, Key, RotateCcw, Trash2, X } from 'lucide-react';
import { Agent, ApiKeys } from '../types';
import { FREE_MODELS } from '../constants/agents';

const MAX_PROMPT_LENGTH = 2000;

interface Props {
  agent: Agent;
  apiKeys: ApiKeys;
  onUpdateAgent: (id: string, updates: Partial<Agent>) => void;
  onUpdateKeys: (keys: ApiKeys) => void;
  onClearHistory: (id: string) => void;
  onResetSession: () => void;
  onClose: () => void;
}

export const SettingsPanel = ({ agent, apiKeys, onUpdateAgent, onUpdateKeys, onClearHistory, onResetSession, onClose }: Props) => {
  const [showKeys, setShowKeys] = useState({ openrouter: false, groq: false });

  const promptLen       = agent.systemPrompt.length;
  const promptNearLimit = promptLen > MAX_PROMPT_LENGTH * 0.85;
  const promptOverLimit = promptLen > MAX_PROMPT_LENGTH;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 md:hidden"
        onClick={onClose}
      />

      {/* Panel — full-screen drawer on mobile, side panel on desktop */}
      <div className="
        fixed inset-x-0 bottom-0 z-50 rounded-t-2xl max-h-[85vh]
        md:static md:inset-auto md:rounded-none md:max-h-none md:z-auto
        w-full md:w-80
        bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800
        flex flex-col overflow-y-auto
        md:shrink-0
      ">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
          <div>
            <h3 className="font-semibold text-white text-sm">Configure Agent</h3>
            <p className="text-xs text-slate-400 mt-0.5">{agent.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-5 flex-1">

          {/* API Keys */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Key size={14} className="text-slate-400" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">API Keys</p>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Keys are stored in your browser's local storage. Don't use on a shared computer.
            </p>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">OpenRouter Key</label>
                <div className="relative">
                  <input
                    type={showKeys.openrouter ? 'text' : 'password'}
                    placeholder="sk-or-..."
                    value={apiKeys.openrouter}
                    onChange={(e) => onUpdateKeys({ ...apiKeys, openrouter: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-600 rounded-lg px-3 py-2 pr-8 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button type="button" onClick={() => setShowKeys((s) => ({ ...s, openrouter: !s.openrouter }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showKeys.openrouter ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
                {apiKeys.openrouter && <p className="text-xs text-emerald-500 mt-1">✓ Key saved</p>}
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Groq Key</label>
                <div className="relative">
                  <input
                    type={showKeys.groq ? 'text' : 'password'}
                    placeholder="gsk_..."
                    value={apiKeys.groq}
                    onChange={(e) => onUpdateKeys({ ...apiKeys, groq: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-600 rounded-lg px-3 py-2 pr-8 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button type="button" onClick={() => setShowKeys((s) => ({ ...s, groq: !s.groq }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showKeys.groq ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
                {apiKeys.groq && <p className="text-xs text-emerald-500 mt-1">✓ Key saved</p>}
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
              <optgroup label="── OpenRouter (uses OR key)">
                {FREE_MODELS.filter((m) => m.provider === 'openrouter').map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </optgroup>
              <optgroup label="── Groq (uses Groq key)">
                {FREE_MODELS.filter((m) => m.provider === 'groq').map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </optgroup>
            </select>
            <p className="text-xs text-slate-600 mt-1">
              Active provider: <span className="text-indigo-400 font-medium">{agent.provider === 'openrouter' ? 'OpenRouter' : 'Groq'}</span>
              {' '}— switching model auto-switches key
            </p>
          </div>

          {/* System Prompt */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Prompt</p>
              <span className={`text-xs ${promptOverLimit ? 'text-red-400' : promptNearLimit ? 'text-amber-400' : 'text-slate-600'}`}>
                {promptLen}/{MAX_PROMPT_LENGTH}
              </span>
            </div>
            <textarea
              value={agent.systemPrompt}
              maxLength={MAX_PROMPT_LENGTH + 200}
              onChange={(e) => {
                if (e.target.value.length <= MAX_PROMPT_LENGTH) {
                  onUpdateAgent(agent.id, { systemPrompt: e.target.value });
                }
              }}
              rows={6}
              className={`w-full bg-slate-800 border text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed ${
                promptOverLimit ? 'border-red-500' : 'border-slate-700'
              }`}
            />
            {promptOverLimit && (
              <p className="text-red-400 text-xs mt-1">Max {MAX_PROMPT_LENGTH} characters</p>
            )}
          </div>

          {/* Danger Zone */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Session</p>
            <button
              onClick={onResetSession}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30 text-amber-400 rounded-lg text-xs transition-colors"
              title="Clears stuck messages and resets all agent statuses to idle"
            >
              <RotateCcw size={13} />
              Reset Session
            </button>
            <button
              onClick={() => onClearHistory(agent.id)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-400 rounded-lg text-xs transition-colors"
            >
              <Trash2 size={13} />
              Clear Conversation
            </button>
            <p className="text-xs text-slate-600 text-center">Reset fixes stuck/blank messages</p>
          </div>

        </div>
      </div>
    </>
  );
};
