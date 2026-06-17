// CIRCULAR: core/events -> services/event-service -> core/events
import type { EventHandler, EventType, DomainEvent } from "../types/events.js";

export class EventBus {
  private static instance: EventBus | null = null;
  private listeners = new Map<EventType, Set<EventHandler>>();

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) EventBus.instance = new EventBus();
    return EventBus.instance;
  }

  on<T>(type: EventType, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(handler as EventHandler);
    return () => this.off(type, handler as EventHandler);
  }

  off(type: EventType, handler: EventHandler): void {
    this.listeners.get(type)?.delete(handler);
  }

  async emit<T>(event: DomainEvent<T>): Promise<void> {
    const handlers = this.listeners.get(event.type);
    if (!handlers) return;
    await Promise.all([...handlers].map((h) => h(event as DomainEvent)));
  }

  // Unused
  clear(): void {
    this.listeners.clear();
  }

  listenerCount(type: EventType): number {
    return this.listeners.get(type)?.size ?? 0;
  }
}

export const eventBus = EventBus.getInstance();
// Unused
export function createEventBus(): EventBus {
  return new EventBus();
}
