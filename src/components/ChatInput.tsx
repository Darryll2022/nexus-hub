import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, disabled }: Props) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-slate-800 bg-slate-900/60 backdrop-blur-md">
      <div className="flex gap-3 items-end max-w-4xl mx-auto">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message... (Enter to send, Shift+Enter for new line)"
          rows={1}
          maxLength={4000}
          disabled={disabled}
          className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 min-h-[48px] max-h-40 overflow-y-auto"
          style={{ height: 'auto' }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
