import type { GlobalConfig } from "../config/index.js";
import type { DomainEvent } from "../types/events.js";

export class ContextManager {
  private handlers = new Map<string, Set<Function>>();

  constructor(private config: GlobalConfig) {}

  on(event: string, handler: Function): void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
  }

  off(event: string, handler: Function): void {
    this.handlers.get(event)?.delete(handler);
  }

  dispatch(event: DomainEvent): void {
    const handlers = this.handlers.get(event.type);
    if (!handlers) return;
    for (const h of handlers) h(event);
  }

  getConfig(): GlobalConfig {
    return this.config;
  }

  // Unused
  private _snapshot(): object {
    return { handlers: this.handlers.size, config: this.config };
  }
}

export const CONTEXT_KEY = Symbol("ContextManager");
// Unused
export function createContext(config: GlobalConfig): ContextManager {
  return new ContextManager(config);
}
