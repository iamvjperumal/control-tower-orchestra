export interface DomainStateStoreConfig<TEntity> {
  domain: string;
  entityIdExtractor: (event: Record<string, unknown>) => string | undefined;
  entityFactory: (id: string) => TEntity;
  entityUpdater: (entity: TEntity, event: Record<string, unknown>, topic: string) => TEntity;
}

export class DomainStateStore<TEntity> {
  readonly domain: string;
  private entities = new Map<string, TEntity>();
  private events: Record<string, unknown>[] = [];
  private recommendations: Record<string, unknown>[] = [];
  private entityIdExtractor: (event: Record<string, unknown>) => string | undefined;
  private entityFactory: (id: string) => TEntity;
  private entityUpdater: (entity: TEntity, event: Record<string, unknown>, topic: string) => TEntity;

  constructor(config: DomainStateStoreConfig<TEntity>) {
    this.domain = config.domain;
    this.entityIdExtractor = config.entityIdExtractor;
    this.entityFactory = config.entityFactory;
    this.entityUpdater = config.entityUpdater;
  }

  processEvent(event: Record<string, unknown>, topic: string): void {
    this.events.push(event);
    if (this.events.length > 1000) this.events.shift();

    const entityId = this.entityIdExtractor(event);
    if (!entityId) return;

    let entity = this.entities.get(entityId);
    if (!entity) {
      entity = this.entityFactory(entityId);
    }
    entity = this.entityUpdater(entity, event, topic);
    this.entities.set(entityId, entity);
  }

  addRecommendation(rec: Record<string, unknown>): void {
    this.recommendations.unshift(rec);
    if (this.recommendations.length > 200) this.recommendations.pop();
  }

  getEntity(id: string): TEntity | undefined {
    return this.entities.get(id);
  }

  getAllEntities(): TEntity[] {
    return Array.from(this.entities.values());
  }

  getRecentEvents(limit: number): Record<string, unknown>[] {
    return this.events.slice(-limit).reverse();
  }

  getRecommendations(limit: number): Record<string, unknown>[] {
    return this.recommendations.slice(0, limit);
  }

  getEntityCount(): number {
    return this.entities.size;
  }

  getEventCount(): number {
    return this.events.length;
  }

  getRecommendationCount(): number {
    return this.recommendations.length;
  }
}
