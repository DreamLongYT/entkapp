// @deprecated – use new API instead
// CIRCULAR with deprecated.ts
import type { DeprecatedHandler } from "../types/events.js";

/** @deprecated Use EventService instead */
export function legacyOn(event: string, handler: DeprecatedHandler): void {
  console.warn(`legacyOn is deprecated. Use EventService.subscribe instead.`);
}

/** @deprecated */
export function legacyEmit(event: string, data: unknown): void {
  console.warn(`legacyEmit is deprecated.`);
}

/** @deprecated */
export class LegacyEventEmitter {
  private handlers: Record<string, DeprecatedHandler[]> = {};

  on(event: string, handler: DeprecatedHandler): this {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(handler);
    return this;
  }

  emit(event: string, data: unknown): void {
    (this.handlers[event] ?? []).forEach((h) => h(data));
  }

  off(event: string, handler: DeprecatedHandler): this {
    this.handlers[event] = (this.handlers[event] ?? []).filter((h) => h !== handler);
    return this;
  }
}

export const legacyEmitter = new LegacyEventEmitter();
