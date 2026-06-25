import type { UseCaseDefinition, TopicMetadata } from './types.js';

class UseCaseRegistry {
  private definitions = new Map<string, UseCaseDefinition>();

  register(def: UseCaseDefinition): void {
    this.definitions.set(def.domain, def);
  }

  get(domain: string): UseCaseDefinition | undefined {
    return this.definitions.get(domain);
  }

  getAll(): UseCaseDefinition[] {
    return Array.from(this.definitions.values());
  }

  getDomains(): string[] {
    return Array.from(this.definitions.keys());
  }

  getAllTopics(): string[] {
    return this.getAll().flatMap((def) => def.allTopics);
  }

  getAllTopicsWithMetadata(): TopicMetadata[] {
    return this.getAll().flatMap((def) =>
      def.allTopics.map((topic) => {
        const parts = topic.split('.');
        return {
          name: topic,
          domain: parts[0],
          entity: parts[1],
          layer: parts[2] || parts[1],
        };
      }),
    );
  }

  getDomainForTopic(topic: string): string | undefined {
    const prefix = topic.split('.')[0];
    return this.definitions.has(prefix) ? prefix : undefined;
  }
}

export const registry = new UseCaseRegistry();
