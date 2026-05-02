import { useState } from 'react';
import { AgentSidebar } from './components/AgentSidebar';
import { Header } from './components/Header';
import { ChatArea } from './components/ChatArea';
import { ChatInput } from './components/ChatInput';
import { SettingsPanel } from './components/SettingsPanel';
import { useAgentChat } from './hooks/useAgentChat';

const App = () => {
  const [showSettings, setShowSettings] = useState(false);
  const {
    agents,
    activeAgent,
    activeId,
    setActiveId,
    apiKeys,
    setApiKeys,
    sendMessage,
    updateAgent,
    clearHistory,
  } = useAgentChat();

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      <AgentSidebar agents={agents} activeId={activeId} onSelect={setActiveId} />

      <div className="flex-1 flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-950 min-w-0">
        <Header
          agent={activeAgent}
          showSettings={showSettings}
          onToggleSettings={() => setShowSettings((v) => !v)}
        />
        <ChatArea agent={activeAgent} />
        <ChatInput
          onSend={sendMessage}
          disabled={activeAgent.status === 'thinking'}
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
    </div>
  );
};

export default App;
