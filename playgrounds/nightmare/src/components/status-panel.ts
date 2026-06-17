// Unused component
import { pluginManager } from "../plugins/index.js";
import { adapterRegistry } from "../adapters/index.js";
import { storeManager } from "../store/index.js";

export class StatusPanel {
  render(): string {
    const plugins = pluginManager.getAll();
    const adapters = adapterRegistry.getAll();
    const stores = storeManager.getAll();
    return JSON.stringify({ plugins: plugins.length, adapters: adapters.length, stores: stores.length });
  }
}

// Unused
export type StatusData = { plugins: number; adapters: number; stores: number };
export const STATUS_REFRESH_INTERVAL = 5000;
