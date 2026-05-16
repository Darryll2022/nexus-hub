/**
 * Shared opencode integration types.
 * Platform-agnostic — no browser or Node-specific imports.
 * Used by both the web app and any future consumers of packages/core.
 */

/** Status of the opencode session connection */
export type OpencodeStatus = 'offline' | 'idle' | 'busy' | 'error';

/**
 * A single Part from the opencode SSE stream, wrapped with a stable id
 * for React keying and upsert logic.
 */
export interface OpencodePart {
  id: string;
  /** Raw part data from the SDK — typed as unknown here to avoid
   *  importing @opencode-ai/sdk into core (web-only dep).
   *  Consumers cast to the appropriate SDK type. */
  part: unknown;
}

/** A single message in an opencode session (user or assistant) */
export interface OpencodeMessage {
  id: string;
  role: 'user' | 'assistant';
  /** Ordered list of parts streamed in for this message */
  parts: OpencodePart[];
  timestamp: Date;
  /** Total USD cost of this message (populated on step-finish) */
  cost?: number;
  /** Token counts (populated on step-finish) */
  tokens?: {
    input: number;
    output: number;
    reasoning: number;
  };
}

/** Snapshot of an opencode session for display purposes */
export interface OpencodeSessionState {
  sessionId: string | null;
  status: OpencodeStatus;
  messages: OpencodeMessage[];
}
