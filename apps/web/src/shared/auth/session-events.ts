export const SESSION_CHANNEL = 'gedpro.session';
export const SESSION_STORAGE_KEY = 'gedpro.session-event';
export type SessionEvent = 'logout' | 'expired' | 'changed';

export function publishSessionEvent(event: SessionEvent) {
  if (typeof window === 'undefined') return;
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(SESSION_CHANNEL);
    channel.postMessage(event);
    channel.close();
  }
  window.localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ event, nonce: crypto.randomUUID() }),
  );
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function parseSessionEvent(value: unknown): SessionEvent | undefined {
  if (value === 'logout' || value === 'expired' || value === 'changed')
    return value;
  return undefined;
}

export function parseStoredSessionEvent(value: string | null) {
  if (!value) return undefined;
  try {
    return parseSessionEvent((JSON.parse(value) as { event?: unknown }).event);
  } catch {
    return undefined;
  }
}
