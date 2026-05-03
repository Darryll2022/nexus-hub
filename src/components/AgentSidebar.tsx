import { Bot, Wrench, Terminal, BookOpen, Zap, Cpu, FlaskConical, Plus, Trash2 } from 'lucide-react';
import { Agent, IconMap } from '../types';

const ICON_MAP: IconMap = { Wrench, Terminal, BookOpen, Zap, Cpu, FlaskConical };

interface Props {
  agents: Agent[];
  activeId: string;
  onSelect: (id: string) => void;
  onNewAgent: () => void;
  onDeleteAgent: (id: string) => void;
}

export const AgentSidebar = ({ agents, activeId, onSelect, onNewAgent, onDeleteAgent }: Props) => (
  <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
    <div className="p-4 border-b border-slate-800 flex items-center gap-3">
      <Bot className="text-indigo-400" size={22} />
      <h1 className="font-bold text-lg tracking-wide text-white flex-1">Nexus Hub</h1>
    </div>

    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
        Active Agents
      </p>
      {agents.map((agent) => {
        const Icon = ICON_MAP[agent.iconName] ?? Bot;
        const isCustom = agent.id.startsWith('custom-');

        return (
          <div key={agent.id} className="group relative">
            <button
              onClick={() => onSelect(agent.id)}
              className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${
                activeId === agent.id
                  ? 'bg-slate-800 shadow-md ring-1 ring-slate-700'
                  : 'hover:bg-slate-800/50'
              }`}
            >
              <div className={`p-2 rounded-lg ${agent.bgColor} shrink-0`}>
                <Icon className={agent.color} size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="font-medium text-slate-100 text-sm truncate pr-2">{agent.name}</p>
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      agent.status === 'thinking'
                        ? 'bg-amber-500 animate-pulse'
                        : agent.status === 'error'
                        ? 'bg-red-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                </div>
                <p className="text-xs text-slate-400 truncate">{agent.role}</p>
              </div>
            </button>

            {/* Delete button — only for custom agents */}
            {isCustom && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteAgent(agent.id);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-700 hover:bg-red-500/20 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                title="Delete agent"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        );
      })}
    </div>

    {/* New Agent button */}
    <div className="p-3 border-t border-slate-800">
      <button
        onClick={onNewAgent}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 text-sm font-medium transition-all"
      >
        <Plus size={15} />
        New Agent
      </button>
    </div>
  </div>
);
