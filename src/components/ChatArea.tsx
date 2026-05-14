import { useEffect, useRef } from 'react';
import { Bot, Wrench, Terminal, BookOpen, User } from 'lucide-react';
import { Agent, Message, IconMap } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

const ICON_MAP: IconMap = { Wrench, Terminal, BookOpen };

interface Props {
  agent: Agent;
  onStop?: () => void;
}

const StreamingCursor = () => (
  <span className="inline-block w-2 h-3.5 bg-emerald-400 rounded-sm ml-0.5 animate-pulse align-middle" />
);

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
        className={`px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[80%] ${
          isUser
            ? 'bg-indigo-600 text-white rounded-tr-sm whitespace-pre-wrap'
            : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm'
        }`}
      >
        {isUser ? (
          msg.text
        ) : (
          <>
            {msg.text ? (
              <MarkdownRenderer content={msg.text} />
            ) : (
              // Empty streaming message — show cursor only
              msg.streaming && <StreamingCursor />
            )}
            {/* Append cursor while streaming */}
            {msg.streaming && msg.text && <StreamingCursor />}
          </>
        )}
      </div>
    </div>
  );
};

export const ChatArea = ({ agent, onStop }: Props) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const isStreaming = agent.status === 'streaming';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agent.history]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {agent.history.map((msg, idx) => (
        <MessageBubble key={idx} msg={msg} agent={agent} />
      ))}

      {/* Thinking dots — only before first chunk arrives */}
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

      {/* Stop button — visible while streaming */}
      {isStreaming && onStop && (
        <div className="flex justify-center">
          <button
            onClick={onStop}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white rounded-full text-xs transition-colors"
          >
            <span className="w-2 h-2 bg-red-400 rounded-sm" />
            Stop generating
          </button>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
