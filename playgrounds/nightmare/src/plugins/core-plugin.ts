// Core plugin – circular: core-plugin -> adapters -> plugins -> core-plugin
import type { IPlugin } from "./index.js";
import type { GlobalConfig } from "../config/index.js";
import { adapterRegistry } from "../adapters/index.js";
import { eventService } from "../services/event-service.js";
import { logger } from "../utils/logger.js";
import { generateUUID } from "../utils/crypto.js";

export const corePlugin: IPlugin = {
  name: "core",
  version: "1.0.0",
  dependencies: [],

  async setup(config: GlobalConfig): Promise<void> {
    logger.info("Core plugin setup", { env: config.env });
    eventService.publish({
      id: generateUUID(),
      type: "plugin.loaded",
      payload: { name: "core" },
      timestamp: new Date(),
    });
    // Register default adapters
    adapterRegistry.register({
      name: "memory",
      type: "storage",
      async connect() { return {}; },
      async disconnect() {},
      isConnected() { return true; },
    });
  },

  async teardown(): Promise<void> {
    logger.info("Core plugin teardown");
    eventService.publish({
      id: generateUUID(),
      type: "plugin.unloaded",
      payload: { name: "core" },
      timestamp: new Date(),
    });
  },
};

// Unused
export const CORE_PLUGIN_TOKEN = Symbol("CorePlugin");
export type CorePluginConfig = { debug: boolean; tracing: boolean };
