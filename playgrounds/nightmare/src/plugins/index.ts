import type { GlobalConfig } from "../config/index.js";
import { logger } from "../utils/logger.js";
// CIRCULAR: plugins -> adapters -> plugins
import type { AdapterRegistry } from "../adapters/index.js";

export interface IPlugin {
  name: string;
  version: string;
  dependencies?: string[];
  setup(config: GlobalConfig): Promise<void>;
  teardown(): Promise<void>;
}

export interface PluginMeta {
  name: string;
  version: string;
  enabled: boolean;
  loadedAt?: Date;
}

export class PluginManager {
  private plugins = new Map<string, IPlugin>();
  private meta = new Map<string, PluginMeta>();
  private adapters?: AdapterRegistry;

  constructor(adapters?: AdapterRegistry) {
    this.adapters = adapters;
  }

  register(plugin: IPlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" already registered`);
    }
    this.plugins.set(plugin.name, plugin);
    this.meta.set(plugin.name, { name: plugin.name, version: plugin.version, enabled: false });
    logger.info("Plugin registered", { name: plugin.name });
  }

  async enable(name: string, config: GlobalConfig): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) throw new Error(`Plugin "${name}" not found`);
    await plugin.setup(config);
    this.meta.get(name)!.enabled = true;
    this.meta.get(name)!.loadedAt = new Date();
  }

  async disable(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) return;
    await plugin.teardown();
    this.meta.get(name)!.enabled = false;
  }

  // Dynamic plugin loading – nightmare for static analysis
  async loadDynamic(path: string): Promise<IPlugin> {
    const mod = await import(/* @vite-ignore */ path);
    const plugin: IPlugin = mod.default ?? mod.plugin;
    this.register(plugin);
    return plugin;
  }

  getAll(): PluginMeta[] {
    return Array.from(this.meta.values());
  }

  // Unused
  has(name: string): boolean {
    return this.plugins.has(name);
  }
}

export function registerPlugin(manager: PluginManager, plugin: IPlugin): void {
  manager.register(plugin);
}

export const pluginManager = new PluginManager();

// Unused
export type PluginFactory = (config: GlobalConfig) => IPlugin;
export const PLUGIN_API_VERSION = "2.0.0";
