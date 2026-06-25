import {
  BaseEvent,
  AIRecommendationCreated,
  Customer360,
  CustomerProfileUpdated,
} from '@signaltwin/shared';

class StateStore {
  private customers = new Map<string, Customer360>();
  private recommendations: AIRecommendationCreated[] = [];
  private events: BaseEvent[] = [];

  updateCustomerProfile(event: CustomerProfileUpdated): void {
    const existing = this.customers.get(event.customer_id);
    this.customers.set(event.customer_id, {
      customer_id: event.customer_id,
      tier: event.tier,
      lifetime_value: event.lifetime_value,
      account_age_days: event.account_age_days,
      region: event.region,
      current_risk_score: existing?.current_risk_score ?? 0,
      recent_events: existing?.recent_events ?? [],
      active_recommendations: existing?.active_recommendations ?? [],
    });
  }

  addEvent(event: BaseEvent): void {
    this.events.unshift(event);
    if (this.events.length > 500) this.events.length = 500;

    const customer = this.customers.get(event.customer_id);
    if (customer) {
      customer.recent_events.unshift(event);
      if (customer.recent_events.length > 50) customer.recent_events.length = 50;
    }
  }

  addRecommendation(rec: AIRecommendationCreated): void {
    this.recommendations.unshift(rec);
    if (this.recommendations.length > 200) this.recommendations.length = 200;

    const customer = this.customers.get(rec.customer_id);
    if (customer) {
      customer.current_risk_score = rec.risk_score;
      customer.active_recommendations.unshift(rec);
      if (customer.active_recommendations.length > 20)
        customer.active_recommendations.length = 20;
    }
  }

  getCustomer(id: string): Customer360 | undefined {
    return this.customers.get(id);
  }

  getCustomerTimeline(id: string): BaseEvent[] {
    return this.events.filter((e) => e.customer_id === id);
  }

  getRecommendations(limit = 50): AIRecommendationCreated[] {
    return this.recommendations.slice(0, limit);
  }

  getRecentEvents(limit = 100): BaseEvent[] {
    return this.events.slice(0, limit);
  }

  getAllCustomers(): Customer360[] {
    return Array.from(this.customers.values());
  }
}

export const stateStore = new StateStore();
