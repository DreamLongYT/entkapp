// CIRCULAR: registry -> pipeline -> registry
import type { Pipeline } from "./pipeline.js";
import type { Result } from "../types/errors.js";

export type Token = string | symbol;
export type Factory<T> = () => T | Promise<T>;
export type Scope = "singleton" | "transient" | "request";

export interface Registration<T = unknown> {
  token: Token;
  factory: Factory<T>;
  scope: Scope;
  tags?: string[];
}

export class Registry {
  private registrations = new Map<Token, Registration>();
  private singletons = new Map<Token, unknown>();
  private _pipeline?: Pipeline;

  register<T>(registration: Registration<T>): void {
    this.registrations.set(registration.token, registration as Registration);
  }

  unregister(token: Token): boolean {
    return this.registrations.delete(token);
  }

  has(token: Token): boolean {
    return this.registrations.has(token);
  }

  async get<T>(token: Token): Promise<Result<T>> {
    const reg = this.registrations.get(token);
    if (!reg) return { ok: false, error: { code: "NOT_FOUND", message: `Token ${String(token)} not found` } };

    if (reg.scope === "singleton") {
      if (this.singletons.has(token)) {
        return { ok: true, value: this.singletons.get(token) as T };
      }
      const value = await reg.factory();
      this.singletons.set(token, value);
      return { ok: true, value: value as T };
    }

    const value = await reg.factory();
    return { ok: true, value: value as T };
  }

  setPipeline(pipeline: Pipeline): void {
    this._pipeline = pipeline;
  }

  // Unused
  dumpAll(): Registration[] {
    return Array.from(this.registrations.values());
  }

  clear(): void {
    this.registrations.clear();
    this.singletons.clear();
  }
}

// Unused exports
export const REGISTRY_SYMBOL = Symbol("Registry");
export function createRegistry(): Registry {
  return new Registry();
}
export const defaultScope: Scope = "singleton";
