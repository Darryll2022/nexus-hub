import { useState } from 'react';
import { Bot, Wrench, Terminal, BookOpen, Zap, Cpu, FlaskConical, Plus, Trash2, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Agent, IconMap } from '../types';

const ICON_MAP: IconMap = { Wrench, Terminal, BookOpen, Zap, Cpu, FlaskConical };

interface Props {
  agents: Agent[];
  activeId: string;
  onSelect: (id: string) => void;
  onNewAgent: () => void;
  onDeleteAgent: (id: string) => void;
}

export const AgentSidebar = ({ agents, activeId, onSelect, onNewAgent, onDeleteAgent }: Props) => {
  // Auto-compact when > 4 agents, user can always override
  const [compact, setCompact] = useState(agents.length > 4);

  return (
    <div className={`h-full bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ${compact ? 'w-16' : 'w-72'}`}>

      {/* Header */}
      <div className={`p-3 border-b border-slate-800 flex items-center ${compact ? 'justify-center' : 'gap-3 px-4'}`}>
        <Bot className="text-indigo-400 shrink-0" size={22} />
        {!compact && <h1 className="font-bold text-lg tracking-wide text-white flex-1">Nexus Hub</h1>}
        {/* Collapse toggle — hidden on mobile since sidebar is an overlay there */}
        <button
          onClick={() => setCompact(v => !v)}
          className="hidden md:flex p-1 rounded-md hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors shrink-0"
          title={compact ? 'Expand sidebar' : 'Compact sidebar'}
        >
          {compact ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
        </button>
      </div>

      {/* Agent list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {!compact && (
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2 pt-1">
            Active Agents
          </p>
        )}

        {agents.map((agent) => {
          const Icon = ICON_MAP[agent.iconName] ?? Bot;
          const isCustom = agent.id.startsWith('custom-');
          const isActive = activeId === agent.id;

          return compact ? (
            /* ── Compact mode: icon + status dot only ── */
            <div key={agent.id} className="relative group flex justify-center">
              <button
                onClick={() => onSelect(agent.id)}
                title={agent.name}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-slate-800 ring-1 ring-slate-600 shadow-md'
                    : 'hover:bg-slate-800/60 active:bg-slate-800'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${agent.bgColor}`}>
                  <Icon className={agent.color} size={16} />
                </div>
              </button>
              {/* Status dot */}
              <span className={`absolute top-1 right-1 w-2 h-2 rounded-full border border-slate-900 ${
                agent.status === 'thinking' || agent.status === 'streaming'
                  ? 'bg-amber-500 animate-pulse'
                  : agent.status === 'error'
                  ? 'bg-red-500'
                  : 'bg-emerald-500'
              }`} />
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 border border-slate-700 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                <p className="font-medium">{agent.name}</p>
                <p className="text-slate-400 text-[10px]">{agent.role}</p>
              </div>
            </div>
          ) : (
            /* ── Full mode: icon + name + role + status ── */
            <div key={agent.id} className="group relative">
              <button
                onClick={() => onSelect(agent.id)}
                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${
                  isActive
                    ? 'bg-slate-800 shadow-md ring-1 ring-slate-700'
                    : 'hover:bg-slate-800/50 active:bg-slate-800/70'
                }`}
              >
                <div className={`p-2 rounded-lg ${agent.bgColor} shrink-0`}>
                  <Icon className={agent.color} size={18} />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-slate-100 text-sm truncate">{agent.name}</p>
                    <div className={`w-2 h-2 rounded-full shrink-0 ml-2 ${
                      agent.status === 'thinking' || agent.status === 'streaming'
                        ? 'bg-amber-500 animate-pulse'
                        : agent.status === 'error'
                        ? 'bg-red-500'
                        : 'bg-emerald-500'
                    }`} />
                  </div>
                  <p className="text-xs text-slate-400 truncate">{agent.role}</p>
                </div>
              </button>

              {/* Delete — always visible on touch, hover on desktop */}
              {isCustom && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteAgent(agent.id); }}
                  className="absolute top-1/2 -translate-y-1/2 right-3 p-1.5 rounded-lg bg-slate-700 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
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
      <div className={`p-2 border-t border-slate-800 ${compact ? 'flex justify-center' : ''}`}>
        {compact ? (
          <button
            onClick={onNewAgent}
            title="New Agent"
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-600/10 hover:bg-indigo-600/20 active:bg-indigo-600/30 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 transition-all"
          >
            <Plus size={16} />
          </button>
        ) : (
          <button
            onClick={onNewAgent}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 active:bg-indigo-600/30 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 text-sm font-medium transition-all"
          >
            <Plus size={15} />
            New Agent
          </button>
        )}
      </div>
    </div>
  );
};
