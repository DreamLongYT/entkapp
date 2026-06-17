// CIRCULAR: resolver -> engine -> resolver
import type { Engine } from "./engine.js";
import { Registry, type Token } from "./registry.js";

export class Resolver {
  private resolutionStack: Token[] = [];

  constructor(
    private registry: Registry,
    private engine: Engine
  ) {}

  resolve<T>(token: Token): T {
    if (this.resolutionStack.includes(token)) {
      throw new Error(`Circular dependency detected for token: ${String(token)}`);
    }
    this.resolutionStack.push(token);
    try {
      // Calls back into engine for sub-resolution
      const subToken = `sub:${String(token)}`;
      if (this.registry.has(subToken)) {
        return this.engine.resolve<T>(subToken);
      }
      // Sync fallback (ignores async factory)
      const reg = (this.registry as any).registrations.get(token);
      if (!reg) throw new Error(`Token not found: ${String(token)}`);
      return reg.factory() as T;
    } finally {
      this.resolutionStack.pop();
    }
  }

  // Unused
  resolveAll<T>(tokens: Token[]): T[] {
    return tokens.map((t) => this.resolve<T>(t));
  }
}

// Unused
export type ResolverMiddleware = (token: Token, next: () => unknown) => unknown;
export const NULL_RESOLVER = new Proxy({} as Resolver, {
  get: () => () => null,
});
