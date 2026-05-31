/**
 * Unit tests — agentHexColor()
 * Tests the Tailwind-class → hex colour mapper used for inline styles.
 */
import { describe, it, expect } from 'vitest';
import { agentHexColor } from '../utils/agentColor';

describe('agentHexColor', () => {
  it('maps amber correctly (Blocker Buster)', () => {
    expect(agentHexColor('bg-amber-400/10')).toBe('#f59e0b');
  });

  it('maps emerald correctly (Atlas)', () => {
    expect(agentHexColor('bg-emerald-400/10')).toBe('#34d399');
  });

  it('maps blue correctly (Lyra)', () => {
    expect(agentHexColor('bg-blue-400/10')).toBe('#60a5fa');
  });

  it('maps violet correctly (Sham)', () => {
    expect(agentHexColor('bg-violet-400/10')).toBe('#a78bfa');
  });

  it('falls back to indigo for unknown colour names', () => {
    expect(agentHexColor('bg-unknowncolor-400/10')).toBe('#818cf8');
  });

  it('falls back to indigo when no bg- prefix', () => {
    expect(agentHexColor('text-amber-400')).toBe('#818cf8');
  });

  it('falls back to indigo for empty string', () => {
    expect(agentHexColor('')).toBe('#818cf8');
  });

  it('maps all expected agent colours without returning indigo fallback', () => {
    const agentColors = [
      'bg-amber-400/10',
      'bg-emerald-400/10',
      'bg-blue-400/10',
      'bg-violet-400/10',
      'bg-cyan-400/10',
      'bg-pink-400/10',
    ];
    const fallback = '#818cf8'; // indigo
    for (const color of agentColors) {
      expect(agentHexColor(color)).not.toBe(fallback);
    }
  });
});
