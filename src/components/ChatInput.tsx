import { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';

interface Props {
  onSend: (text: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  streaming?: boolean;
}

export const ChatInput = ({ onSend, onStop, disabled = false, streaming = false }: Props) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || streaming) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (streaming && onStop) {
        onStop();
      } else {
        submit();
      }
    }
    if (e.key === 'Escape' && streaming && onStop) {
      onStop();
    }
  };

  return (
    <div className="p-4 border-t border-slate-800 bg-slate-950">
      <div className="max-w-3xl mx-auto flex gap-3 items-end">
        <textarea
          ref={textareaRef}
          rows={1}
          maxLength={4000}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          disabled={disabled && !streaming}
          placeholder={streaming ? 'Streaming… (Esc or ↵ to stop)' : 'Message an agent… (⇧↵ for new line)'}
          className="flex-1 bg-slate-800 border border-slate-700 focus:border-indigo-500 text-slate-200 placeholder-slate-500 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors leading-relaxed"
        />
        {streaming ? (
          <button
            onClick={onStop}
            className="w-10 h-10 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-400 flex items-center justify-center shrink-0 transition-colors"
            title="Stop generating (Esc)"
          >
            <Square size={16} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!value.trim() || disabled}
            className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center shrink-0 transition-colors"
            title="Send (↵)"
          >
            <Send size={16} />
          </button>
        )}
      </div>
      <p className="text-center text-slate-600 text-xs mt-2">
        {value.length > 0 && (
          <span className={value.length > 3800 ? 'text-amber-500' : ''}>
            {value.length}/4000 ·{' '}
          </span>
        )}
        Shift+Enter for new line
      </p>
    </div>
  );
};
