import crypto from 'node:crypto';
import { SupportTicketUpdated, TOPICS } from '@signaltwin/shared';
import { publishMessage } from '../services/kafka-producer.js';

const CHANNELS: SupportTicketUpdated['channel'][] = ['chat', 'email', 'phone'];
const CATEGORIES = ['billing', 'shipping', 'refund', 'product-issue', 'account', 'general'];

export function generateSupportTicket(overrides?: Partial<SupportTicketUpdated>): SupportTicketUpdated {
  const sentimentRoll = Math.random();
  const sentiment: SupportTicketUpdated['sentiment'] =
    sentimentRoll < 0.25 ? 'negative' : sentimentRoll < 0.85 ? 'neutral' : 'positive';
  const sentimentScore = sentiment === 'negative' ? -(Math.random() * 0.8 + 0.2)
    : sentiment === 'positive' ? Math.random() * 0.8 + 0.2
    : (Math.random() - 0.5) * 0.4;

  return {
    event_id: crypto.randomUUID(),
    event_type: 'support-ticket-updated',
    event_time: new Date().toISOString(),
    source_system: 'zendesk',
    customer_id: overrides?.customer_id || 'c-1001',
    ticket_id: `tkt-${crypto.randomUUID().slice(0, 8)}`,
    channel: CHANNELS[Math.floor(Math.random() * CHANNELS.length)],
    sentiment,
    sentiment_score: Math.round(sentimentScore * 100) / 100,
    category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
    summary_hash: crypto.createHash('sha256').update(`summary-${crypto.randomUUID()}`).digest('hex').slice(0, 12),
    ...overrides,
  };
}

export async function publishSupportTicket(overrides?: Partial<SupportTicketUpdated>): Promise<SupportTicketUpdated> {
  const ticket = generateSupportTicket(overrides);
  await publishMessage(TOPICS.RAW_SUPPORT, ticket.customer_id, ticket);
  console.log(`Published support ticket ${ticket.ticket_id} (${ticket.sentiment}) for ${ticket.customer_id}`);
  return ticket;
}
