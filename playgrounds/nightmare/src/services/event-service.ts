// CIRCULAR: event-service -> core/events -> services/event-service (via re-export)
import { EventBus, eventBus } from "../core/events.js";
import type { DomainEvent, EventType, EventHandler } from "../types/events.js";
import { logger } from "../utils/logger.js";

export class EventService {
  private bus: EventBus;
  private middlewares: Array<(event: DomainEvent) => DomainEvent | null> = [];

  constructor(bus: EventBus = eventBus) {
    this.bus = bus;
  }

  use(middleware: (event: DomainEvent) => DomainEvent | null): void {
    this.middlewares.push(middleware);
  }

  async publish<T>(event: DomainEvent<T>): Promise<void> {
    let current: DomainEvent | null = event as DomainEvent;
    for (const mw of this.middlewares) {
      current = mw(current);
      if (!current) {
        logger.debug("Event swallowed by middleware", { type: event.type });
        return;
      }
    }
    await this.bus.emit(current as DomainEvent<T>);
  }

  subscribe<T>(type: EventType, handler: EventHandler<T>): () => void {
    return this.bus.on(type, handler);
  }

  // Unused
  subscribeAll(handler: EventHandler): void {
    const types: EventType[] = [
      "user.created", "user.updated", "user.deleted",
      "session.started", "session.ended",
      "data.synced", "plugin.loaded", "plugin.unloaded",
      "store.updated", "store.reset",
    ];
    for (const t of types) this.bus.on(t, handler);
  }
}

export const eventService = new EventService();
// Unused
export type EventMiddleware = (event: DomainEvent) => DomainEvent | null;
export const EVENT_NAMESPACE = "nightmare" as const;
