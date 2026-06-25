import { useState, useEffect } from 'react';
import { AIRecommendationCreated } from '../types';
import { api } from '../api/client';
import { useSSE } from './useSSE';

export function useRecommendations() {
  const [initial, setInitial] = useState<AIRecommendationCreated[]>([]);
  const { events: live, connected } = useSSE<AIRecommendationCreated>(
    api.sseRecommendationsUrl,
    'recommendation',
  );

  useEffect(() => {
    api.fetchRecommendations().then(setInitial).catch(console.error);
  }, []);

  const all = [...live, ...initial.filter((i) => !live.some((l) => l.event_id === i.event_id))];
  return { recommendations: all, connected };
}
