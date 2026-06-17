// Plugin registry – imports all plugins and registers them
// CIRCULAR: plugin-registry -> core-plugin -> adapters -> plugins -> plugin-registry
import { pluginManager } from "./index.js";
import { corePlugin } from "./core-plugin.js";
import { authPlugin } from "./auth-plugin.js";
import { storagePlugin } from "./storage-plugin.js";

// Register all built-in plugins
pluginManager.register(corePlugin);
pluginManager.register(authPlugin);
pluginManager.register(storagePlugin);

export { pluginManager };
export const REGISTERED_PLUGINS = ["core", "auth", "storage"] as const;
export type RegisteredPlugin = (typeof REGISTERED_PLUGINS)[number];

// Dynamic plugin loader – loads additional plugins at runtime
export async function loadExternalPlugins(paths: string[]): Promise<void> {
  for (const path of paths) {
    await pluginManager.loadDynamic(path);
  }
}

// Unused
export const PLUGIN_REGISTRY_VERSION = "1.0.0";
export type PluginRegistryConfig = { autoLoad: boolean; paths: string[] };
