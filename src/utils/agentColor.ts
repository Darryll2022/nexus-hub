/**
 * Maps an agent bgColor Tailwind class → raw hex for use in inline styles.
 * e.g. "bg-amber-400/10" → "#f59e0b"
 */
const COLOR_MAP: Record<string, string> = {
  amber:   '#f59e0b',
  emerald: '#34d399',
  blue:    '#60a5fa',
  violet:  '#a78bfa',
  yellow:  '#facc15',
  cyan:    '#22d3ee',
  pink:    '#f472b6',
  indigo:  '#818cf8',
  red:     '#f87171',
  green:   '#4ade80',
  sky:     '#38bdf8',
  purple:  '#c084fc',
  rose:    '#fb7185',
  teal:    '#2dd4bf',
  orange:  '#fb923c',
};

export function agentHexColor(bgColor: string): string {
  const match = bgColor.match(/bg-([a-z]+)-/);
  if (!match) return COLOR_MAP.indigo;
  return COLOR_MAP[match[1]] ?? COLOR_MAP.indigo;
}
