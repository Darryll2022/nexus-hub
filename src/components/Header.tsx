import { Bot, Wrench, Terminal, BookOpen, Activity, Settings } from 'lucide-react';
import { Agent, IconMap } from '../types';

const ICON_MAP: IconMap = { Wrench, Terminal, BookOpen };

interface Props {
  agent: Agent;
  showSettings: boolean;
  onToggleSettings: () => void;
}

export const Header = ({ agent, showSettings, onToggleSettings }: Props) => {
  const Icon = ICON_MAP[agent.iconName] ?? Bot;

  return (
    <div className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${agent.bgColor}`}>
          <Icon className={agent.color} size={20} />
        </div>
        <div>
          <h2 className="font-bold text-white text-sm flex items-center gap-2">
            {agent.name}
            {agent.status === 'thinking' && (
              <Activity size={12} className="text-amber-500 animate-spin" />
            )}
          </h2>
          <p className="text-xs text-slate-400">{agent.role} · {agent.model.split('/').pop()}</p>
        </div>
      </div>
      <button
        onClick={onToggleSettings}
        className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
          showSettings ? 'bg-slate-700 text-white' : 'hover:bg-slate-800 text-slate-400'
        }`}
      >
        <Settings size={16} />
        Configure
      </button>
    </div>
  );
};
