/**
 * useOpencodeSession
 *
 * Manages the full lifecycle of a single opencode session:
 *   1. Creates a session against the local opencode server on mount
 *   2. Subscribes to the global SSE /event stream, filtering by sessionID
 *   3. Exposes sendMessage() / abort() for the chat UI
 *
 * Browser-only hook — lives in src/hooks/, NOT in packages/core/.
 *
 * Graceful degradation: if the server is unreachable, status stays 'offline'
 * and all methods are no-ops. The UI renders an offline banner in that state.
 */

import { createOpencodeClient } from '@opencode-ai/sdk';
import type {
  GlobalEvent,
  Part,
  AssistantMessage,
} from '@opencode-ai/sdk';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { OpencodeMessage, OpencodePart, OpencodeStatus } from '../../packages/core/src/opencode-types';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Default opencode server URL — proxied via Vite in dev, direct in local prod */
const DEFAULT_SERVER_URL = 'http://127.0.0.1:4096';

/** ms to wait before declaring the server offline on init */
const CONNECTION_TIMEOUT_MS = 5_000;

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useOpencodeSession(
  serverUrl: string = DEFAULT_SERVER_URL,
  directory: string = '.'
) {
  const clientRef  = useRef(createOpencodeClient({ baseUrl: serverUrl }));
  const esRef      = useRef<EventSource | null>(null);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [sessionId, setSessionId]   = useState<string | null>(null);
  const [messages,  setMessages]    = useState<OpencodeMessage[]>([]);
  const [status,    setStatus]      = useState<OpencodeStatus>('offline');

  // ── 1. Session creation ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    // Timeout guard — if create() never resolves, mark offline
    timerRef.current = setTimeout(() => {
      if (!cancelled && status === 'offline') {
        console.warn('[useOpencodeSession] Server did not respond within timeout — staying offline.');
      }
    }, CONNECTION_TIMEOUT_MS);

    clientRef.current = createOpencodeClient({ baseUrl: serverUrl });

    clientRef.current.session
      .create({ query: { directory } })
      .then((res) => {
        if (cancelled) return;
        if (res.data) {
          setSessionId(res.data.id);
          setStatus('idle');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('offline');
      })
      .finally(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
      });

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      // Note: we deliberately do NOT destroy the session — opencode persists
      // sessions across reconnects so conversation history is preserved.
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl, directory]);

  // ── 2. SSE subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;

    // In development (Vite proxy active) use /opencode/event to avoid CORS.
    // In local production (user runs `vite preview` + `opencode serve`), hit direct.
    // S12: Validate serverUrl is a local origin before constructing EventSource URL.
    // Prevents an attacker-controlled serverUrl from pointing the SSE stream at an
    // arbitrary external server if the settings value is somehow tampered with.
    const safeUrl = serverUrl.startsWith('http://127.0.0.1') || serverUrl.startsWith('http://localhost')
      ? serverUrl
      : DEFAULT_SERVER_URL;  // fall back to default if origin is unexpected
    const eventUrl = `${safeUrl}/event`;

    try {
      const es = new EventSource(eventUrl);
      esRef.current = es;

      es.onmessage = (e: MessageEvent) => {
        try {
          const global = JSON.parse(e.data as string) as GlobalEvent;
          const event  = global.payload;
          handleEvent(event, sessionId);
        } catch {
          // Malformed event — safe to ignore
        }
      };

      es.onerror = () => {
        setStatus((prev) => (prev === 'offline' ? 'offline' : 'error'));
      };
    } catch {
      setStatus('offline');
    }

    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, serverUrl]);

  // ── 3. Event handler (stable ref to avoid ESS closure staleness) ────────
  const handleEvent = useCallback(
    (event: GlobalEvent['payload'], sid: string) => {
      switch (event.type) {
        case 'session.status': {
          if (event.properties.sessionID !== sid) return;
          const t = (event.properties.status as { type: string }).type;
          setStatus(t === 'busy' ? 'busy' : 'idle');
          break;
        }

        case 'session.idle': {
          if (event.properties.sessionID !== sid) return;
          setStatus('idle');
          break;
        }

        case 'message.part.updated': {
          const part = event.properties.part as Part & {
            sessionID: string;
            messageID: string;
            id: string;
          };
          if (part.sessionID !== sid) return;
          setMessages((prev) => upsertPart(prev, part));
          break;
        }

        case 'message.updated': {
          const msg = event.properties.info;
          if (msg.sessionID !== sid) return;
          if (msg.role === 'assistant') {
            const a = msg as AssistantMessage;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === a.id
                  ? {
                      ...m,
                      cost:   a.cost,
                      tokens: {
                        input:     a.tokens.input,
                        output:    a.tokens.output,
                        reasoning: a.tokens.reasoning,
                      },
                    }
                  : m
              )
            );
          }
          break;
        }

        default:
          break;
      }
    },
    []
  );

  // ── 4. sendMessage ──────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      if (!sessionId || status === 'busy' || status === 'offline') return;

      // Optimistically add the user message to local state
      const userMsg: OpencodeMessage = {
        id:        `user-${Date.now()}`,
        role:      'user',
        parts:     [{ id: `user-text-${Date.now()}`, part: { type: 'text', text } }],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        // promptAsync returns immediately — result streams in via SSE
        await clientRef.current.session.promptAsync({
          path: { id: sessionId },
          body: { parts: [{ type: 'text', text }] },
        });
      } catch (err) {
        console.error('[useOpencodeSession] promptAsync failed:', err);
        setStatus('error');
      }
    },
    [sessionId, status]
  );

  // ── 5. abort ────────────────────────────────────────────────────────────
  const abort = useCallback(async () => {
    if (!sessionId) return;
    try {
      await clientRef.current.session.abort({ path: { id: sessionId } });
    } catch {
      // Server may already be done — safe to ignore
    } finally {
      setStatus('idle');
    }
  }, [sessionId]);

  // ── 6. Public surface ───────────────────────────────────────────────────
  return {
    sessionId,
    messages,
    status,
    sendMessage,
    abort,
  } as const;
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

/**
 * Upsert a streamed Part into the messages array.
 * If a message with the part's messageID already exists, update (or append) the part.
 * If not, create a new assistant message.
 */
function upsertPart(
  messages: OpencodeMessage[],
  part: Part & { sessionID: string; messageID: string; id: string }
): OpencodeMessage[] {
  const msgId  = part.messageID;
  const partId = part.id;
  const partItem: OpencodePart = { id: partId, part };

  const msgIndex = messages.findIndex((m) => m.id === msgId);

  if (msgIndex >= 0) {
    return messages.map((m, i) =>
      i === msgIndex
        ? { ...m, parts: upsertPartById(m.parts, partItem) }
        : m
    );
  }

  // New message
  return [
    ...messages,
    {
      id:        msgId,
      role:      'assistant',
      parts:     [partItem],
      timestamp: new Date(),
    },
  ];
}

/**
 * Insert or replace a part within a parts array, matched by id.
 * Parts can arrive out of order — this handles both cases correctly.
 */
function upsertPartById(parts: OpencodePart[], item: OpencodePart): OpencodePart[] {
  const idx = parts.findIndex((p) => p.id === item.id);
  if (idx >= 0) {
    const next = [...parts];
    next[idx] = item;
    return next;
  }
  return [...parts, item];
}
