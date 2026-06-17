// Lazy service – loaded via dynamic import in index.ts
// This creates a nightmare: the file is both statically imported (via barrel)
// AND dynamically imported (via computed string in index.ts)

export class LazyService {
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    // Dynamic self-reference – nightmare for analyzers
    const self = await import("./lazy.js");
    console.log("LazyService re-imported:", self.LazyService.name);
    this.initialized = true;
  }

  async loadPlugin(name: string): Promise<unknown> {
    // Fully dynamic – impossible to statically analyze
    const plugin = await import(`../plugins/${name}.js`);
    return plugin.default ?? plugin;
  }

  // Unused
  async loadAdapter(type: string, name: string): Promise<unknown> {
    return import(`../adapters/${type}/${name}.js`);
  }
}

export const lazyService = new LazyService();
// Unused
export type LazyLoader<T> = () => Promise<T>;
export function createLazyLoader<T>(factory: () => Promise<T>): LazyLoader<T> {
  let cached: T | undefined;
  return async () => {
    if (!cached) cached = await factory();
    return cached;
  };
}
