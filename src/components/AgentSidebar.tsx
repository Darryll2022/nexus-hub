import { Bot, Wrench, Terminal, BookOpen, Activity } from 'lucide-react';
import { Agent } from '../types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  Wrench, Terminal, BookOpen,
};

interface Props {
  agents: Agent[];
  activeId: string;
  onSelect: (id: string) => void;
}

export const AgentSidebar = ({ agents, activeId, onSelect }: Props) => (
  <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
    <div className="p-4 border-b border-slate-800 flex items-center gap-3">
      <Bot className="text-indigo-400" size={22} />
      <h1 className="font-bold text-lg tracking-wide text-white">Nexus Hub</h1>
    </div>

    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
        Active Agents
      </p>
      {agents.map((agent) => {
        const Icon = ICON_MAP[agent.iconName] ?? Bot;
        return (
          <button
            key={agent.id}
            onClick={() => onSelect(agent.id)}
            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${
              activeId === agent.id
                ? 'bg-slate-800 shadow-md ring-1 ring-slate-700'
                : 'hover:bg-slate-800/50'
            }`}
          >
            <div className={`p-2 rounded-lg ${agent.bgColor}`}>
              <Icon className={agent.color} size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <p className="font-medium text-slate-100 text-sm truncate">{agent.name}</p>
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ml-2 ${
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
        );
      })}
    </div>
  </div>
);
