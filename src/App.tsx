import { useState, useEffect } from 'react';
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
    updateAgent, clearConversation: clearHistory, resetAllStreams: resetSession, addAgent, deleteAgent,
  } = useAgentChat();

  // ── BYOK from portfolio deep-link ─────────────────────────────────────────
  // Portfolio passes key as hash fragment: nexus-hub.vercel.app/#orkey=sk-or-...
  // Hash never reaches server logs. We read it once, save to state, then clear.
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith('#orkey=')) return;
    const raw = decodeURIComponent(hash.slice('#orkey='.length));
    if (!raw || !raw.startsWith('sk-or-')) return;
    // Merge into existing keys (don't overwrite groq key if present)
    setApiKeys({ ...apiKeys, openrouter: raw });
    // Clear hash so the key isn't visible in the URL bar
    window.history.replaceState(null, '', window.location.pathname);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className="flex h-[100dvh] bg-slate-950 text-slate-200 font-sans overflow-hidden relative">

      {/* ── Mobile backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      {/* Mobile: fixed slide-over overlay; Desktop: static sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-[280px] transition-transform duration-300 ease-in-out
        md:static md:w-auto md:translate-x-0 md:z-auto md:shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
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
      <div className="flex-1 flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-950 min-w-0 w-full">
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
          onResetSession={resetSession}
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
