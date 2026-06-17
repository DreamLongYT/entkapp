// CIRCULAR: adapters -> plugins -> adapters
import type { IPlugin } from "../plugins/index.js";
import { logger } from "../utils/logger.js";

export interface Adapter<TConfig = unknown, TClient = unknown> {
  name: string;
  type: string;
  connect(config: TConfig): Promise<TClient>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

export class AdapterRegistry {
  private adapters = new Map<string, Adapter>();
  private connections = new Map<string, unknown>();

  register<T extends Adapter>(adapter: T): void {
    this.adapters.set(adapter.name, adapter);
    logger.debug("Adapter registered", { name: adapter.name, type: adapter.type });
  }

  async connect(name: string, config: unknown): Promise<unknown> {
    const adapter = this.adapters.get(name);
    if (!adapter) throw new Error(`Adapter "${name}" not registered`);
    const client = await adapter.connect(config);
    this.connections.set(name, client);
    return client;
  }

  async disconnectAll(): Promise<void> {
    for (const [name, adapter] of this.adapters) {
      if (adapter.isConnected()) {
        await adapter.disconnect();
        this.connections.delete(name);
      }
    }
  }

  // Circular: uses plugin interface
  async loadFromPlugin(plugin: IPlugin, config: unknown): Promise<void> {
    logger.info("Loading adapter from plugin", { plugin: plugin.name });
    // Dynamic adapter loading from plugin
    const mod = await import(`../plugins/${plugin.name}/adapter.js`).catch(() => null);
    if (mod?.default) {
      this.register(mod.default as Adapter);
      await this.connect(mod.default.name, config);
    }
  }

  getAll(): Adapter[] {
    return Array.from(this.adapters.values());
  }

  // Unused
  has(name: string): boolean {
    return this.adapters.has(name);
  }
}

export const adapterRegistry = new AdapterRegistry();
// Unused
export type AdapterFactory<T extends Adapter> = () => T;
export const ADAPTER_TYPES = ["database", "cache", "storage", "message-queue", "search"] as const;
export type AdapterType = (typeof ADAPTER_TYPES)[number];
