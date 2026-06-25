import { FastifyInstance } from 'fastify';
import Anthropic from '@anthropic-ai/sdk';
import { stateStore } from '../services/state-store.js';

const client = new Anthropic();

// Store fleet data reference (will be injected by fleet routes)
let fleetDataGetter: (() => { vehicles: any[]; incidents: any[]; decisions: any[] }) | null = null;

export function setFleetDataGetter(getter: () => { vehicles: any[]; incidents: any[]; decisions: any[] }): void {
  fleetDataGetter = getter;
}

function buildContext(entityId?: string, domain?: string): string {
  // Detect domain from entityId or use provided domain
  const detectedDomain = domain || (entityId?.startsWith('VH-') || entityId?.startsWith('V-') ? 'fleet' : entityId?.startsWith('c-') || entityId?.startsWith('C-') ? 'retail' : 'retail');
  
  let context = `## Platform State\n`;
  
  if (detectedDomain === 'fleet' && fleetDataGetter) {
    // Fleet-specific context
    const { vehicles, incidents, decisions } = fleetDataGetter();
    
    context += `Domain: Fleet Operations\n`;
    context += `Active vehicles: ${vehicles.length}\n`;
    context += `Active incidents: ${incidents.filter((i: any) => !i.resolved).length}\n`;
    context += `Pending agent decisions: ${decisions.filter((d: any) => d.status === 'pending').length}\n\n`;
    
    // Add vehicle summaries
    context += `## Fleet Vehicles\n`;
    for (const v of vehicles.slice(0, 20)) {
      context += `- ${v.vehicle_id}: status=${v.status}, driver=${v.driver_name}, eta_drift=${v.eta_drift_minutes}m, safety=${v.safety_score}, maintenance_risk=${v.maintenance_risk}%\n`;
    }
    
    // Add active incidents
    context += `\n## Active Fleet Incidents\n`;
    for (const inc of incidents.filter((i: any) => !i.resolved).slice(0, 15)) {
      context += `- ${inc.vehicle_id}: ${inc.type} (${inc.severity}) - ${inc.message}\n`;
    }
    
    // Add agent decisions
    context += `\n## AI Agent Decisions\n`;
    for (const dec of decisions.slice(0, 15)) {
      context += `- ${dec.vehicle_id}: ${dec.agent_type} recommends ${dec.recommended_action} (${dec.severity}, ${Math.round(dec.confidence * 100)}% confidence)\n`;
    }
    
    // If specific vehicle requested
    if (entityId) {
      const vehicle = vehicles.find((v: any) => v.vehicle_id === entityId);
      if (vehicle) {
        context += `\n## Focused Vehicle: ${entityId}\n`;
        context += `Driver: ${vehicle.driver_name}\n`;
        context += `Type: ${vehicle.vehicle_type}\n`;
        context += `Status: ${vehicle.status}\n`;
        context += `Speed: ${vehicle.speed_kmh} km/h\n`;
        context += `ETA Drift: ${vehicle.eta_drift_minutes} minutes\n`;
        context += `Safety Score: ${vehicle.safety_score}\n`;
        context += `Maintenance Risk: ${vehicle.maintenance_risk}%\n`;
        context += `Destination: ${vehicle.destination}\n`;
        if (vehicle.coldchain_temp_c !== null) {
          context += `Cold Chain: ${vehicle.coldchain_temp_c}°C (target: ${vehicle.coldchain_target_c}°C)\n`;
        }
      }
    }
  } else {
    // Retail-specific context (original)
    const customers = stateStore.getAllCustomers();
    const recentEvents = stateStore.getRecentEvents(50);
    const recommendations = stateStore.getRecommendations(20);
    
    context += `Domain: Retail Operations\n`;
    context += `Active customers: ${customers.length}\n`;
    context += `Recent events: ${recentEvents.length}\n`;
    context += `Active recommendations: ${recommendations.length}\n\n`;

    // Add customer summaries
    context += `## Customers\n`;
    for (const c of customers) {
      context += `- ${c.customer_id}: tier=${c.tier}, risk=${c.current_risk_score}, ltv=$${c.lifetime_value}, region=${c.region}, events=${c.recent_events.length}, recs=${c.active_recommendations.length}\n`;
    }

    // Add recent recommendations
    context += `\n## Active Recommendations\n`;
    for (const r of recommendations) {
      context += `- ${r.customer_id}: action=${r.action}, score=${r.risk_score}, priority=${r.priority}, confidence=${r.confidence}, reasons=[${r.reason.join('; ')}]\n`;
    }

    // Add recent events summary
    context += `\n## Recent Events (last 50)\n`;
    for (const e of recentEvents.slice(0, 30)) {
      context += `- [${e.event_time}] ${e.event_type} for ${e.customer_id}\n`;
    }

    // If specific customer requested, add detailed view
    if (entityId) {
      const customer = stateStore.getCustomer(entityId);
      const timeline = stateStore.getCustomerTimeline(entityId);
      if (customer) {
        context += `\n## Focused Customer: ${entityId}\n`;
        context += `Tier: ${customer.tier}\n`;
        context += `Risk Score: ${customer.current_risk_score}\n`;
        context += `Lifetime Value: $${customer.lifetime_value}\n`;
        context += `Region: ${customer.region}\n`;
        context += `Account Age: ${customer.account_age_days} days\n`;
        context += `\nTimeline (${timeline.length} events):\n`;
        for (const e of timeline) {
          context += `  [${e.event_time}] ${e.event_type}\n`;
        }
        context += `\nActive Recommendations:\n`;
        for (const r of customer.active_recommendations) {
          context += `  - ${r.action}: score=${r.risk_score}, reasons=[${r.reason.join('; ')}]\n`;
        }
      }
    }
  }

  return context;
}

// Detect customer ID or vehicle ID references in the message
function extractEntityId(message: string): { id: string; domain: string } | undefined {
  // Check for vehicle ID (VH-XXXX or V-XXXX)
  const vehicleMatch = message.match(/VH?-?\d{4}/i);
  if (vehicleMatch) {
    return { id: vehicleMatch[0].toUpperCase().replace(/([VH]+)-?(\d)/, '$1-$2'), domain: 'fleet' };
  }
  
  // Check for customer ID (C-XXXX or c-XXXX)
  const customerMatch = message.match(/[Cc]-?\d{4}/);
  if (customerMatch) {
    return { id: customerMatch[0].toUpperCase().replace(/C-?(\d)/, 'C-$1'), domain: 'retail' };
  }
  
  return undefined;
}

export async function copilotRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { message: string; customerId?: string; domain?: string } }>(
    '/api/copilot/chat',
    async (request, reply) => {
      const { message, customerId, domain } = request.body;
      if (!message) {
        return reply.status(400).send({ error: 'message is required' });
      }

      const extracted = extractEntityId(message);
      const entityId = customerId || extracted?.id;
      const detectedDomain = domain || extracted?.domain || 'retail';
      const context = buildContext(entityId, detectedDomain);

      const systemPrompt = detectedDomain === 'fleet'
        ? `You are FleetOps Copilot, an intelligent assistant for the Fleet Operations Control Tower — a real-time logistics and fleet management platform.

You have access to live vehicle telemetry, driver events, cold chain monitoring, maintenance signals, and AI agent decisions.

Your role:
- Answer questions about vehicles, drivers, incidents, and agent decisions
- Explain WHY vehicles were flagged or escalated
- Provide safety score breakdowns and maintenance risk analysis
- Help dispatchers understand AI agent recommendations
- Reference real data from the platform state below

Fleet Thresholds:
- ETA Drift Warning: 10 minutes
- ETA Drift Critical: 20 minutes
- Cold Chain Deviation Warning: 2.0°C
- Cold Chain Deviation Critical: 5.0°C
- Safety Score Warning: <70
- Safety Score Critical: <50
- Maintenance Risk Warning: 40%
- Maintenance Risk Critical: 70%

IMPORTANT: Only reference data that exists in the platform state below. Never hallucinate vehicles or incidents that don't exist.

${context}`
        : `You are CTO Copilot, an intelligent assistant for the Control Tower Orchestra — a real-time risk, retention, and operations platform.

You have access to live streaming data from Kafka topics, risk signals computed by Flink, and AI-generated recommendations.

Your role:
- Answer questions about customers, risk scores, recommendations, and events
- Explain WHY customers were flagged or scored
- Provide risk score breakdowns with contributing signals
- Help operators understand AI decisions
- Reference real data from the platform state below

When explaining risk scores, show the breakdown:
- Payment failures in 10 min: +30
- Premium shipment delay: +20
- Negative support in 24h: +25
- Refund after shipment issue: +15
- VIP customer priority: +10
- Threshold for escalation: 60

IMPORTANT: Only reference data that exists in the platform state below. Never hallucinate customers or events that don't exist.

${context}`;

      const start = Date.now();

      try {
        const response = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: message }],
        });

        const answer = response.content
          .filter((block): block is Anthropic.TextBlock => block.type === 'text')
          .map((block) => block.text)
          .join('');

        const latencyMs = Date.now() - start;

        // Extract referenced signals based on domain
        const sources: string[] = [];
        let signals: any[] = [];

        if (detectedDomain === 'fleet' && fleetDataGetter) {
          const { decisions } = fleetDataGetter();
          const relevantDecs = entityId
            ? decisions.filter((d: any) => d.vehicle_id === entityId)
            : decisions.slice(0, 5);
          
          signals = relevantDecs.map((d: any) => ({
            vehicle_id: d.vehicle_id,
            agent_type: d.agent_type,
            severity: d.severity,
            recommended_action: d.recommended_action,
            confidence: d.confidence,
          }));
          
          if (entityId) sources.push(`vehicle:${entityId}`);
          sources.push('fleet.risk.alerts', 'fleet.agent.decisions');
        } else {
          const recommendations = stateStore.getRecommendations(50);
          const relevantRecs = entityId
            ? recommendations.filter(r => r.customer_id === entityId)
            : recommendations.slice(0, 5);

          signals = relevantRecs.map(r => ({
            customer_id: r.customer_id,
            risk_score: r.risk_score,
            action: r.action,
            priority: r.priority,
          }));
          
          if (entityId) sources.push(`customer_360:${entityId}`);
          sources.push('retail.risk.signals', 'retail.recommendations.decisions');
        }
        
        if (answer.toLowerCase().includes('lineage')) sources.push('governance.lineage');

        return {
          answer,
          sources,
          signals,
          confidence: 0.92,
          latency_ms: latencyMs,
        };
      } catch (err) {
        console.error('Copilot error:', err);
        return reply.status(500).send({ error: 'Copilot unavailable' });
      }
    },
  );

  // GET suggested prompts
  app.get<{ Querystring: { domain?: string } }>('/api/copilot/suggestions', async (request) => {
    const domain = request.query.domain || 'retail';
    
    if (domain === 'fleet' && fleetDataGetter) {
      const { vehicles, incidents, decisions } = fleetDataGetter();
      
      const suggestions: string[] = [
        'Show me all vehicles with high maintenance risk',
        'What is the current fleet status?',
      ];

      if (decisions.length > 0) {
        const first = decisions[0];
        suggestions.push(`Why was ${first.vehicle_id} flagged?`);
        suggestions.push(`Explain the decision for ${first.vehicle_id}`);
      }

      const critical = incidents.filter((i: any) => i.severity === 'critical' && !i.resolved);
      if (critical.length > 0) {
        suggestions.push(`Show all critical incidents`);
      }

      suggestions.push('Which vehicles have ETA drift issues?');
      suggestions.push('Show cold chain breaches');

      return { suggestions: suggestions.slice(0, 6) };
    } else {
      const customers = stateStore.getAllCustomers();
      const recommendations = stateStore.getRecommendations(5);

      const suggestions: string[] = [
        'Show me all high-risk customers',
        'What is the current platform status?',
      ];

      if (recommendations.length > 0) {
        const first = recommendations[0];
        suggestions.push(`Why was ${first.customer_id} flagged?`);
        suggestions.push(`Explain the risk score for ${first.customer_id}`);
      }

      const critical = recommendations.filter(r => r.priority === 'CRITICAL');
      if (critical.length > 0) {
        suggestions.push(`Show all critical recommendations`);
      }

      suggestions.push('Which customers are at risk of churn?');
      suggestions.push('Explain the data lineage for recommendations');

      return { suggestions: suggestions.slice(0, 6) };
    }
  });
}
