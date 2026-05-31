/**
 * humanizeError.ts
 * Converts raw API error objects into readable user-facing strings.
 * Handles Groq rate-limit JSON payloads and OpenRouter APICallError messages.
 */
export function humanizeError(err: unknown): string {
  if (!(err instanceof Error)) return 'Unknown error occurred.';
  const raw = err.message;

  const jsonStart = raw.indexOf('{');
  if (jsonStart >= 0) {
    try {
      const firstJson = raw.slice(jsonStart).split('\n')[0].replace(/,$/, '');
      const parsed = JSON.parse(firstJson);

      if (parsed.type === 'exceeded_limit' || parsed.status === 'exceeded_limit') {
        const resetsAt: number = parsed.resetsAt ?? parsed.resets_at;
        if (resetsAt) {
          const resetDate = new Date(resetsAt * 1000);
          const formatted = resetDate.toLocaleString('en-SG', {
            timeZone: 'Asia/Singapore',
            dateStyle: 'medium',
            timeStyle: 'short',
          });
          return `Rate limit reached. Groq quota resets at ${formatted} (SGT). Try again then, or enter a paid key.`;
        }
        return 'Rate limit reached. Please wait before sending again.';
      }

      if (parsed.error?.message) return parsed.error.message;
      if (parsed.message) return parsed.message;
    } catch {
      // not JSON — fall through
    }
  }

  const cleaned = raw
    .replace(/^AI_APICallError:\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .trim();

  return cleaned || 'An unexpected error occurred.';
}
