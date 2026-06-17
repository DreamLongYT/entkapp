// Unused component
import { usePlugins } from "../hooks/use-plugin.js";
import type { PluginMeta } from "../plugins/index.js";

export class PluginList {
  render(): string {
    const plugins: PluginMeta[] = usePlugins();
    return plugins.map((p) => `<Plugin name="${p.name}" version="${p.version}" enabled="${p.enabled}" />`).join("\n");
  }
}

// Unused
export type PluginListProps = { filter?: string; showDisabled?: boolean };
