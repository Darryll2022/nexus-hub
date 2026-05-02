import { useEffect, useRef } from 'react';
import { Bot, Wrench, Terminal, BookOpen, User } from 'lucide-react';
import { Agent, Message } from '../types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  Wrench, Terminal, BookOpen,
};

interface Props {
  agent: Agent;
}

const MessageBubble = ({ msg, agent }: { msg: Message; agent: Agent }) => {
  const Icon = ICON_MAP[agent.iconName] ?? Bot;
  const isUser = msg.role === 'user';

  return (
    <div className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? 'bg-indigo-600' : agent.bgColor
        }`}
      >
        {isUser ? <User size={14} /> : <Icon className={agent.color} size={14} />}
      </div>
      <div
        className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap max-w-[80%] ${
          isUser
            ? 'bg-indigo-600 text-white rounded-tr-sm'
            : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm'
        }`}
      >
        {msg.text}
      </div>
    </div>
  );
};

export const ChatArea = ({ agent }: Props) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agent.history]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {agent.history.map((msg, idx) => (
        <MessageBubble key={idx} msg={msg} agent={agent} />
      ))}
      {agent.status === 'thinking' && (
        <div className="flex gap-3 max-w-3xl">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${agent.bgColor}`}>
            <Bot className={agent.color} size={14} />
          </div>
          <div className="px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 rounded-tl-sm">
            <div className="flex gap-1 items-center h-5">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};
