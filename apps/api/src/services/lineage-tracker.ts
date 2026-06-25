/**
 * LineageTracker — counts Kafka messages per topic as they flow through
 * the API consumer and exposes live throughput stats used by the
 * Stream Lineage view and SSE stream.
 */

import type { TopicStats, LineageStatsResponse } from '@signaltwin/core';
import { getAllTopicsWithMetadata } from '@signaltwin/core';

interface BucketEntry {
  count: number;
  ts: number; // epoch ms when this bucket was opened
}

class LineageTracker {
  // Cumulative message-in count per topic
  private totalIn = new Map<string, number>();
  // Ring buffer of 10-second buckets for msg/s calculation
  private buckets = new Map<string, BucketEntry[]>();
  // Consumer-group lag: groupId -> topic -> lag
  private lagMap = new Map<string, Map<string, number>>();

  private readonly BUCKET_WINDOW_MS = 10_000;
  private readonly MAX_BUCKETS = 6; // 1-minute history

  /** Call this every time a message is consumed on a topic. */
  record(topic: string): void {
    // Increment total
    this.totalIn.set(topic, (this.totalIn.get(topic) ?? 0) + 1);

    // Increment current bucket
    const now = Date.now();
    const buckets = this.buckets.get(topic) ?? [];
    const currentBucket = buckets[buckets.length - 1];
    if (!currentBucket || now - currentBucket.ts >= this.BUCKET_WINDOW_MS) {
      buckets.push({ count: 1, ts: now });
      if (buckets.length > this.MAX_BUCKETS) buckets.shift();
    } else {
      currentBucket.count += 1;
    }
    this.buckets.set(topic, buckets);
  }

  /** Update consumer-group lag for a topic (call from your admin client poll). */
  setLag(groupId: string, topic: string, lag: number): void {
    if (!this.lagMap.has(groupId)) this.lagMap.set(groupId, new Map());
    this.lagMap.get(groupId)!.set(topic, lag);
  }

  /** Rolling messages-per-second over the last BUCKET_WINDOW_MS window. */
  private msgPerSec(topic: string): number {
    const buckets = this.buckets.get(topic);
    if (!buckets || buckets.length === 0) return 0;
    const now = Date.now();
    // Sum counts in the last BUCKET_WINDOW_MS
    const windowStart = now - this.BUCKET_WINDOW_MS;
    let sum = 0;
    for (const b of buckets) {
      if (b.ts >= windowStart) sum += b.count;
    }
    return parseFloat((sum / (this.BUCKET_WINDOW_MS / 1000)).toFixed(2));
  }

  /** Build the full stats snapshot from the topic registry + live counters. */
  getStats(): LineageStatsResponse {
    const topicsMeta = getAllTopicsWithMetadata();
    const now = Date.now();

    const topics: TopicStats[] = topicsMeta.map(({ name, domain, layer }) => {
      // Aggregate lag per topic across all known groups
      const consumerGroups: { groupId: string; lag: number }[] = [];
      for (const [groupId, topicLag] of this.lagMap) {
        const lag = topicLag.get(name);
        if (lag !== undefined) consumerGroups.push({ groupId, lag });
      }

      const messagesIn = this.totalIn.get(name) ?? 0;
      return {
        topic: name,
        domain,
        layer,
        messagesIn,
        messagesOut: messagesIn, // approximate — same as in for pass-through
        msgPerSec: this.msgPerSec(name),
        consumerGroups,
        lastUpdated: now,
      };
    });

    return { topics, generatedAt: now };
  }

  /** Return stats for a single topic (null if unknown). */
  getTopicStats(topic: string): TopicStats | null {
    const meta = getAllTopicsWithMetadata().find((t) => t.name === topic);
    if (!meta) return null;
    const now = Date.now();
    const consumerGroups: { groupId: string; lag: number }[] = [];
    for (const [groupId, topicLag] of this.lagMap) {
      const lag = topicLag.get(topic);
      if (lag !== undefined) consumerGroups.push({ groupId, lag });
    }
    const messagesIn = this.totalIn.get(topic) ?? 0;
    return {
      topic,
      domain: meta.domain,
      layer: meta.layer,
      messagesIn,
      messagesOut: messagesIn,
      msgPerSec: this.msgPerSec(topic),
      consumerGroups,
      lastUpdated: now,
    };
  }
}

export const lineageTracker = new LineageTracker();
