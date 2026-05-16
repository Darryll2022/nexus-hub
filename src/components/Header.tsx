import { Bot, Wrench, Terminal, BookOpen, Activity, Settings, Menu, X } from 'lucide-react';
import { Agent, IconMap } from '../types';

const ICON_MAP: IconMap = { Wrench, Terminal, BookOpen };

interface Props {
  agent: Agent;
  showSettings: boolean;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onToggleSettings: () => void;
}

export const Header = ({ agent, showSettings, sidebarOpen, onToggleSidebar, onToggleSettings }: Props) => {
  const Icon = ICON_MAP[agent.iconName] ?? Bot;

  return (
    <div className="h-14 md:h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-3 md:px-6 shrink-0 z-10 gap-2">

      {/* Hamburger — mobile only */}
      <button
        onClick={onToggleSidebar}
        className="md:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400 shrink-0 transition-colors"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Agent info */}
      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
        <div className={`p-1.5 md:p-2 rounded-lg ${agent.bgColor} shrink-0`}>
          <Icon className={agent.color} size={16} />
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-white text-sm flex items-center gap-2 truncate">
            {agent.name}
            {agent.status === 'thinking' && (
              <Activity size={12} className="text-amber-500 animate-spin shrink-0" />
            )}
          </h2>
          <p className="text-xs text-slate-400 truncate hidden sm:block">
            {agent.role} · {agent.model.split('/').pop()}
          </p>
        </div>
      </div>

      {/* Settings button — icon only on mobile, icon+label on desktop */}
      <button
        onClick={onToggleSettings}
        className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shrink-0 ${
          showSettings ? 'bg-slate-700 text-white' : 'hover:bg-slate-800 text-slate-400'
        }`}
        title="Configure agent"
      >
        <Settings size={16} />
        <span className="hidden md:inline">Configure</span>
      </button>
    </div>
  );
};
