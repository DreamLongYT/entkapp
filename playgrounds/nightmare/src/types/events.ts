import type { ID, UserId } from "./index.js";

export type EventType =
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "session.started"
  | "session.ended"
  | "data.synced"
  | "plugin.loaded"
  | "plugin.unloaded"
  | "store.updated"
  | "store.reset";

export interface DomainEvent<T = unknown> {
  id: ID;
  type: EventType;
  payload: T;
  timestamp: Date;
  userId?: UserId;
  correlationId?: string;
}

export type EventHandler<T = unknown> = (event: DomainEvent<T>) => void | Promise<void>;
export type EventMap = Record<EventType, DomainEvent>;

// Unused event types
export type LegacyEvent = { __legacy: true; data: any };
export type DeprecatedHandler = (data: any) => void;
