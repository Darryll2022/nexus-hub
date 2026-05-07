/**
 * Renders markdown content in chat bubbles using react-native-markdown-display.
 * Styled to match the dark theme.
 */
import React from 'react';
import Markdown from 'react-native-markdown-display';

interface MarkdownMessageProps {
  content: string;
  accentColor?: string;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({
  content,
  accentColor = '#34D399',
}) => {
  return (
    <Markdown style={markdownStyles(accentColor)}>
      {content}
    </Markdown>
  );
};

const markdownStyles = (accent: string) => ({
  body: {
    color: '#e5e5e5',
    fontSize: 15,
    lineHeight: 22,
  },
  heading1: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700' as const,
    marginVertical: 8,
  },
  heading2: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700' as const,
    marginVertical: 6,
  },
  heading3: {
    color: '#cccccc',
    fontSize: 15,
    fontWeight: '600' as const,
    marginVertical: 4,
  },
  paragraph: {
    color: '#e5e5e5',
    fontSize: 15,
    lineHeight: 22,
    marginVertical: 2,
  },
  strong: {
    color: '#ffffff',
    fontWeight: '700' as const,
  },
  em: {
    color: '#cccccc',
    fontStyle: 'italic' as const,
  },
  code_inline: {
    backgroundColor: '#2a2a2a',
    color: accent,
    fontFamily: 'monospace',
    fontSize: 13,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  fence: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: accent,
  },
  code_block: {
    backgroundColor: '#1a1a1a',
    color: '#e5e5e5',
    fontFamily: 'monospace',
    fontSize: 13,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  list_item: {
    color: '#e5e5e5',
    fontSize: 15,
    lineHeight: 22,
    marginVertical: 2,
  },
  blockquote: {
    backgroundColor: '#1a1a1a',
    borderLeftWidth: 3,
    borderLeftColor: accent,
    paddingLeft: 12,
    marginVertical: 6,
  },
  hr: {
    backgroundColor: '#2a2a2a',
    height: 1,
    marginVertical: 12,
  },
  link: {
    color: accent,
    textDecorationLine: 'underline' as const,
  },
  table: {
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 6,
    marginVertical: 8,
  },
  th: {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    fontWeight: '700' as const,
    padding: 8,
    fontSize: 13,
  },
  td: {
    color: '#e5e5e5',
    padding: 8,
    fontSize: 13,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
});
