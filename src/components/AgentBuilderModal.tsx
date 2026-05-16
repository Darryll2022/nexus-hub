import { useState } from 'react';
import { X, Bot, Wrench, Terminal, BookOpen, Zap, Cpu, FlaskConical } from 'lucide-react';
import { Agent } from '../types';
import { FREE_MODELS } from '../constants/agents';

const ICONS = [
  { name: 'Bot',          component: Bot,          color: 'text-violet-400',  bg: 'bg-violet-400/10'  },
  { name: 'Wrench',       component: Wrench,       color: 'text-amber-400',   bg: 'bg-amber-400/10'   },
  { name: 'Terminal',     component: Terminal,     color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { name: 'BookOpen',     component: BookOpen,     color: 'text-blue-400',    bg: 'bg-blue-400/10'    },
  { name: 'Zap',          component: Zap,          color: 'text-yellow-400',  bg: 'bg-yellow-400/10'  },
  { name: 'Cpu',          component: Cpu,          color: 'text-cyan-400',    bg: 'bg-cyan-400/10'    },
  { name: 'FlaskConical', component: FlaskConical, color: 'text-pink-400',    bg: 'bg-pink-400/10'    },
];

// M3: Max character limits
const MAX_NAME_LENGTH   = 40;
const MAX_ROLE_LENGTH   = 60;
const MAX_PROMPT_LENGTH = 2000;

interface Props {
  onClose: () => void;
  onSave: (agent: Omit<Agent, 'status' | 'history'>) => void;
  editingAgent?: Agent | null;
}

const defaultForm = {
  name: '',
  role: '',
  iconName: 'Bot',
  model: FREE_MODELS[0].id,
  systemPrompt: '',
};

export const AgentBuilderModal = ({ onClose, onSave, editingAgent }: Props) => {
  const [form, setForm] = useState({
    name:         editingAgent?.name         ?? defaultForm.name,
    role:         editingAgent?.role         ?? defaultForm.role,
    iconName:     editingAgent?.iconName     ?? defaultForm.iconName,
    model:        editingAgent?.model        ?? defaultForm.model,
    systemPrompt: editingAgent?.systemPrompt ?? defaultForm.systemPrompt,
  });

  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const selectedIcon  = ICONS.find((i) => i.name === form.iconName) ?? ICONS[0];
  const selectedModel = FREE_MODELS.find((m) => m.id === form.model) ?? FREE_MODELS[0];

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.name.trim())                                  e.name         = 'Name is required';
    else if (form.name.length > MAX_NAME_LENGTH)            e.name         = `Max ${MAX_NAME_LENGTH} characters`;
    if (!form.role.trim())                                  e.role         = 'Role is required';
    else if (form.role.length > MAX_ROLE_LENGTH)            e.role         = `Max ${MAX_ROLE_LENGTH} characters`;
    if (!form.systemPrompt.trim())                          e.systemPrompt = 'System prompt is required';
    else if (form.systemPrompt.length > MAX_PROMPT_LENGTH)  e.systemPrompt = `Max ${MAX_PROMPT_LENGTH} characters`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      id:         editingAgent?.id ?? `custom-${crypto.randomUUID()}`,
      name:       form.name.trim(),
      role:       form.role.trim(),
      iconName:   form.iconName,
      color:      selectedIcon.color,
      bgColor:    selectedIcon.bg,
      model:      form.model,
      provider:   selectedModel.provider,
      systemPrompt: form.systemPrompt.trim(),
    });
    onClose();
  };

  const promptLen = form.systemPrompt.length;
  const promptNearLimit = promptLen > MAX_PROMPT_LENGTH * 0.85;
  const promptOverLimit = promptLen > MAX_PROMPT_LENGTH;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90dvh] flex flex-col shadow-2xl mx-0 sm:mx-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <h2 className="font-bold text-white">
            {editingAgent ? 'Edit Agent' : 'New Agent'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* Name */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</label>
              <span className={`text-xs ${form.name.length > MAX_NAME_LENGTH ? 'text-red-400' : 'text-slate-600'}`}>
                {form.name.length}/{MAX_NAME_LENGTH}
              </span>
            </div>
            <input
              type="text"
              maxLength={MAX_NAME_LENGTH + 10}
              placeholder="e.g. Cipher, Scout, Forge..."
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={`w-full bg-slate-800 border rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                errors.name ? 'border-red-500' : 'border-slate-700'
              }`}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Role */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</label>
              <span className={`text-xs ${form.role.length > MAX_ROLE_LENGTH ? 'text-red-400' : 'text-slate-600'}`}>
                {form.role.length}/{MAX_ROLE_LENGTH}
              </span>
            </div>
            <input
              type="text"
              maxLength={MAX_ROLE_LENGTH + 10}
              placeholder="e.g. Security Auditor, UI/UX Expert..."
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className={`w-full bg-slate-800 border rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                errors.role ? 'border-red-500' : 'border-slate-700'
              }`}
            />
            {errors.role && <p className="text-red-400 text-xs mt-1">{errors.role}</p>}
          </div>

          {/* Icon picker */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              Icon
            </label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map(({ name, component: Icon, color, bg }) => (
                <button
                  key={name}
                  onClick={() => setForm((f) => ({ ...f, iconName: name }))}
                  className={`p-2.5 rounded-xl border transition-all ${
                    form.iconName === name
                      ? `${bg} border-indigo-500 ring-1 ring-indigo-500`
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <Icon className={form.iconName === name ? color : 'text-slate-400'} size={18} />
                </button>
              ))}
            </div>
          </div>

          {/* Model */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
              Model
            </label>
            <select
              value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {FREE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* System Prompt */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                System Prompt
              </label>
              <span className={`text-xs ${promptOverLimit ? 'text-red-400' : promptNearLimit ? 'text-amber-400' : 'text-slate-600'}`}>
                {promptLen}/{MAX_PROMPT_LENGTH}
              </span>
            </div>
            <textarea
              rows={6}
              placeholder="Describe this agent's persona, expertise, and how it should respond..."
              value={form.systemPrompt}
              onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
              className={`w-full bg-slate-800 border rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed ${
                errors.systemPrompt || promptOverLimit ? 'border-red-500' : 'border-slate-700'
              }`}
            />
            {errors.systemPrompt && (
              <p className="text-red-400 text-xs mt-1">{errors.systemPrompt}</p>
            )}
          </div>

          {/* Preview */}
          <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-4">
            <p className="text-xs text-slate-500 mb-2 font-medium">Preview</p>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${selectedIcon.bg}`}>
                <selectedIcon.component className={selectedIcon.color} size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {form.name || 'Agent Name'}
                </p>
                <p className="text-xs text-slate-400">
                  {form.role || 'Agent Role'} · {selectedModel.name.split('(')[1]?.replace(')', '') ?? selectedModel.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex gap-3 justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
          >
            {editingAgent ? 'Save Changes' : 'Create Agent'}
          </button>
        </div>
      </div>
    </div>
  );
};
