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
  const [showBuilder, setShowBuilder] = useState(false);

  const {
    agents,
    activeAgent,
    activeId,
    setActiveId,
    apiKeys,
    setApiKeys,
    sendMessage,
    stopStream,
    updateAgent,
    clearHistory,
    addAgent,
    deleteAgent,
  } = useAgentChat();

  const handleSaveAgent = (agentDef: Omit<Agent, 'status' | 'history'>) => {
    addAgent(agentDef);
    setShowBuilder(false);
  };

  const isStreaming = activeAgent.status === 'streaming';

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      <AgentSidebar
        agents={agents}
        activeId={activeId}
        onSelect={(id) => {
          setActiveId(id);
          setShowSettings(false);
        }}
        onNewAgent={() => setShowBuilder(true)}
        onDeleteAgent={deleteAgent}
      />

      <div className="flex-1 flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-950 min-w-0">
        <Header
          agent={activeAgent}
          showSettings={showSettings}
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

      {showSettings && (
        <SettingsPanel
          agent={activeAgent}
          apiKeys={apiKeys}
          onUpdateAgent={updateAgent}
          onUpdateKeys={setApiKeys}
          onClearHistory={clearHistory}
        />
      )}

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
