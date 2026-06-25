import { useState, useEffect, useRef } from 'react';

export function useSSE<T>(url: string, eventType: string): { events: T[]; connected: boolean } {
  const [events, setEvents] = useState<T[]>([]);
  const [connected, setConnected] = useState(false);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const source = new EventSource(url);
    sourceRef.current = source;

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);

    source.addEventListener(eventType, (e: MessageEvent) => {
      const data = JSON.parse(e.data) as T;
      setEvents((prev) => [data, ...prev].slice(0, 100));
    });

    return () => {
      source.close();
      setConnected(false);
    };
  }, [url, eventType]);

  return { events, connected };
}
