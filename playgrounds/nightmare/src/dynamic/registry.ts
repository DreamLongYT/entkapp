// NOTE: Same name as core/registry – intentional nightmare for barrel re-exports
// When both are re-exported via index.ts, there's a name collision

export class DynamicRegistry {
  private entries = new Map<string, () => Promise<unknown>>();

  register(name: string, loader: () => Promise<unknown>): void {
    this.entries.set(name, loader);
  }

  async load(name: string): Promise<unknown> {
    const loader = this.entries.get(name);
    if (!loader) throw new Error(`No loader for "${name}"`);
    return loader();
  }

  // Computed registration – nightmare
  registerAll(map: Record<string, () => Promise<unknown>>): void {
    for (const [k, v] of Object.entries(map)) {
      this.register(k, v);
    }
  }

  // Unused
  list(): string[] {
    return Array.from(this.entries.keys());
  }
}

export const dynamicRegistry = new DynamicRegistry();

// Self-registering dynamic modules
dynamicRegistry.registerAll({
  computed: () => import("./computed.js"),
  factory: () => import("./factory.js"),
  experimental: () => import("./experimental.js"),
  // Recursive self-reference
  registry: () => import("./registry.js"),
});

// Unused
export type DynamicEntry = { name: string; loader: () => Promise<unknown> };
export const DYNAMIC_REGISTRY_VERSION = 1;
