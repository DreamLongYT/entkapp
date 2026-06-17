// Unused hook
import { pluginManager } from "../plugins/index.js";
import type { IPlugin, PluginMeta } from "../plugins/index.js";

export function usePlugins(): PluginMeta[] {
  return pluginManager.getAll();
}

export function usePlugin(name: string): IPlugin | undefined {
  return (pluginManager as any).plugins.get(name);
}

// Unused
export type PluginHookResult = { plugins: PluginMeta[]; loading: boolean; error: Error | null };
