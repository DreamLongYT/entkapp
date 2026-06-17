// CIRCULAR: storage-plugin -> services/storage -> services/cache -> storage-plugin (via adapter)
import type { IPlugin } from "./index.js";
import type { GlobalConfig } from "../config/index.js";
import { InMemoryStorage } from "../services/storage.js";
import { LRUCache } from "../services/cache.js";
import { adapterRegistry } from "../adapters/index.js";

export const storagePlugin: IPlugin = {
  name: "storage",
  version: "1.0.0",
  dependencies: ["core"],

  async setup(_config: GlobalConfig): Promise<void> {
    const cache = new LRUCache(500);
    const storage = new InMemoryStorage(cache);

    adapterRegistry.register({
      name: "storage-plugin-adapter",
      type: "storage",
      async connect() { return storage; },
      async disconnect() {},
      isConnected() { return true; },
    });
  },

  async teardown(): Promise<void> {
    adapterRegistry.getAll()
      .filter((a) => a.name === "storage-plugin-adapter")
      .forEach((a) => a.disconnect());
  },
};

// Unused
export type StoragePluginConfig = { maxSize: number; ttl: number; driver: string };
export const STORAGE_PLUGIN_SYMBOL = Symbol("StoragePlugin");
