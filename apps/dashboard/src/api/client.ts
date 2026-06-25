import type { GovernanceDomain, TopicMetadata, PIIFieldMapping, DataContract, GovernanceMetrics, AgentInfo, LineageData, LineageStatsResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, options);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  baseUrl: API_URL,

  // Retail
  fetchRecommendations: () => apiFetch<any[]>('/recommendations'),
  fetchEvents: () => apiFetch<any[]>('/events'),
  fetchCustomer: (id: string) => apiFetch<any>(`/customers/${id}`),
  fetchCustomers: () => apiFetch<any[]>('/customers'),
  fetchCustomerTimeline: (id: string) => apiFetch<any[]>(`/customers/${id}/timeline`),

  // Governance — cross-domain
  fetchGovernanceDomains: () => apiFetch<GovernanceDomain[]>('/governance/domains'),
  fetchGovernanceLineage: (domain?: string) =>
    apiFetch<LineageData>(domain ? `/governance/lineage/${domain}` : '/governance/lineage'),
  fetchGovernanceTopics: (domain?: string) =>
    apiFetch<TopicMetadata[]>(domain ? `/governance/topics/${domain}` : '/governance/topics'),
  fetchGovernanceSchemas: () => apiFetch<string[]>('/governance/schemas'),
  fetchSchemaDetail: (subject: string) => apiFetch<any>(`/governance/schemas/${subject}`),
  fetchGovernancePII: (domain?: string) =>
    apiFetch<PIIFieldMapping[]>(domain ? `/governance/pii/${domain}` : '/governance/pii'),
  fetchGovernanceContracts: () => apiFetch<DataContract[]>('/governance/contracts'),
  fetchGovernanceMetrics: () => apiFetch<GovernanceMetrics>('/governance/metrics'),
  fetchGovernanceAgents: () => apiFetch<AgentInfo[]>('/governance/agents'),

  // Stream Lineage — live stats and SSE
  fetchLineageStats: () => apiFetch<LineageStatsResponse>('/governance/lineage/stats'),
  lineageStreamUrl: `${API_URL}/governance/lineage/stream`,

  // Actions
  submitAction: (body: { recommendation_id: string; action_taken: string; operator_id: string }) =>
    apiFetch<any>('/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  // Copilot
  sendCopilotMessage: (message: string, customerId?: string) =>
    apiFetch<{ answer: string; sources: string[]; signals: any[]; confidence: number }>('/api/copilot/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, customerId }),
    }),
  fetchCopilotSuggestions: () => apiFetch<{ suggestions: string[] }>('/api/copilot/suggestions'),

  // Replay
  fetchReplayScenarios: () => apiFetch<any[]>('/api/replay/scenarios'),
  fetchReplayScenario: (id: string) => apiFetch<any>(`/api/replay/scenarios/${id}`),

  // SSE
  sseEventsUrl: `${API_URL}/events/stream`,
  sseRecommendationsUrl: `${API_URL}/recommendations/stream`,
};
