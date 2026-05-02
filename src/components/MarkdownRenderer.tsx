import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  content: string;
}

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-slate-200 transition-colors"
      title="Copy code"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
};

export const MarkdownRenderer = ({ content }: Props) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      // Code blocks with syntax highlighting
      code({ className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        const codeString = String(children).replace(/\n$/, '');
        const isInline = !match && !codeString.includes('\n');

        if (isInline) {
          return (
            <code
              className="bg-slate-700 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono"
              {...props}
            >
              {children}
            </code>
          );
        }

        return (
          <div className="relative my-3 rounded-xl overflow-hidden border border-slate-700">
            {match && (
              <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900 border-b border-slate-700">
                <span className="text-xs text-slate-400 font-mono">{match[1]}</span>
              </div>
            )}
            <CopyButton text={codeString} />
            <SyntaxHighlighter
              style={oneDark}
              language={match?.[1] || 'text'}
              PreTag="div"
              customStyle={{
                margin: 0,
                borderRadius: 0,
                background: '#0f172a',
                fontSize: '0.8rem',
                padding: '1rem',
              }}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        );
      },

      // Headings
      h1: ({ children }) => <h1 className="text-base font-bold text-white mt-4 mb-2">{children}</h1>,
      h2: ({ children }) => <h2 className="text-sm font-bold text-white mt-3 mb-1.5">{children}</h2>,
      h3: ({ children }) => <h3 className="text-sm font-semibold text-slate-200 mt-3 mb-1">{children}</h3>,

      // Paragraphs
      p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,

      // Lists
      ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2 pl-2">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2 pl-2">{children}</ol>,
      li: ({ children }) => <li className="text-slate-200 text-sm">{children}</li>,

      // Blockquote
      blockquote: ({ children }) => (
        <blockquote className="border-l-2 border-indigo-500 pl-3 my-2 text-slate-400 italic">
          {children}
        </blockquote>
      ),

      // Bold / Italic
      strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
      em: ({ children }) => <em className="italic text-slate-300">{children}</em>,

      // Horizontal rule
      hr: () => <hr className="border-slate-700 my-3" />,

      // Tables (GFM)
      table: ({ children }) => (
        <div className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse border border-slate-700 rounded-lg overflow-hidden">
            {children}
          </table>
        </div>
      ),
      thead: ({ children }) => <thead className="bg-slate-800">{children}</thead>,
      tbody: ({ children }) => <tbody>{children}</tbody>,
      tr: ({ children }) => <tr className="border-b border-slate-700">{children}</tr>,
      th: ({ children }) => <th className="px-3 py-2 text-left font-semibold text-slate-300">{children}</th>,
      td: ({ children }) => <td className="px-3 py-2 text-slate-400">{children}</td>,

      // Links
      a: ({ href, children }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
        >
          {children}
        </a>
      ),
    }}
  >
    {content}
  </ReactMarkdown>
);
