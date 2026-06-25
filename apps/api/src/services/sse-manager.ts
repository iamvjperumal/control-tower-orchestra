import { FastifyReply } from 'fastify';
import crypto from 'node:crypto';

class SSEManager {
  private clients = new Map<string, FastifyReply>();

  addClient(reply: FastifyReply): string {
    const id = crypto.randomUUID();
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    this.clients.set(id, reply);
    reply.raw.on('close', () => this.clients.delete(id));
    return id;
  }

  broadcast(eventType: string, data: unknown): void {
    const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const reply of this.clients.values()) {
      reply.raw.write(payload);
    }
  }

  get clientCount(): number {
    return this.clients.size;
  }
}

export const eventSSE = new SSEManager();
export const recommendationSSE = new SSEManager();
/** Dedicated SSE channel for live Stream Lineage pulses */
export const lineageSSE = new SSEManager();
