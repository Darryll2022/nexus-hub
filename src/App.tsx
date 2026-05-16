import { useState } from 'react';
import { AgentSidebar } from './components/AgentSidebar';
import { Header } from './components/Header';
import { ChatArea } from './components/ChatArea';
import { ChatInput } from './components/ChatInput';
import { SettingsPanel } from './components/SettingsPanel';
import { AgentBuilderModal } from './components/AgentBuilderModal';
import { useAgentChat } from './hooks/useAgentChat';
import { Agent } from './types';

const App = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showBuilder, setShowBuilder]   = useState(false);
  const [sidebarOpen, setSidebarOpen]   = useState(false);

  const {
    agents, activeAgent, activeId, setActiveId,
    apiKeys, setApiKeys, sendMessage, stopStream,
    updateAgent, clearHistory, addAgent, deleteAgent,
  } = useAgentChat();

  const handleSaveAgent = (agentDef: Omit<Agent, 'status' | 'history'>) => {
    addAgent(agentDef);
    setShowBuilder(false);
  };

  const handleSelectAgent = (id: string) => {
    setActiveId(id);
    setShowSettings(false);
    setSidebarOpen(false); // close sidebar on mobile after selecting
  };

  const isStreaming = activeAgent.status === 'streaming';

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">

      {/* ── Mobile backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-72 transition-transform duration-300
        md:static md:translate-x-0 md:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <AgentSidebar
          agents={agents}
          activeId={activeId}
          onSelect={handleSelectAgent}
          onNewAgent={() => { setShowBuilder(true); setSidebarOpen(false); }}
          onDeleteAgent={deleteAgent}
        />
      </div>

      {/* ── Main pane ── */}
      <div className="flex-1 flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-950 min-w-0">
        <Header
          agent={activeAgent}
          showSettings={showSettings}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onToggleSettings={() => setShowSettings((v) => !v)}
        />
        <ChatArea agent={activeAgent} onStop={stopStream} />
        <ChatInput
          onSend={sendMessage}
          onStop={stopStream}
          disabled={activeAgent.status === 'thinking'}
          streaming={isStreaming}
        />
      </div>

      {/* ── Settings panel ── */}
      {showSettings && (
        <SettingsPanel
          agent={activeAgent}
          apiKeys={apiKeys}
          onUpdateAgent={updateAgent}
          onUpdateKeys={setApiKeys}
          onClearHistory={clearHistory}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* ── Agent builder modal ── */}
      {showBuilder && (
        <AgentBuilderModal
          onClose={() => setShowBuilder(false)}
          onSave={handleSaveAgent}
        />
      )}
    </div>
  );
};

export default App;
