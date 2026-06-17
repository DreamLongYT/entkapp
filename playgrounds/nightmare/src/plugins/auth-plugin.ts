// CIRCULAR: auth-plugin -> services/auth -> plugins/index -> auth-plugin
import type { IPlugin } from "./index.js";
import type { GlobalConfig } from "../config/index.js";
import { AuthService } from "../services/auth.js";
import { storageService } from "../services/storage.js";
import { logger } from "../utils/logger.js";

export const authPlugin: IPlugin = {
  name: "auth",
  version: "1.0.0",
  dependencies: ["core"],

  async setup(config: GlobalConfig): Promise<void> {
    logger.info("Auth plugin setup", { env: config.env });
    const authService = new AuthService(storageService);
    // Register in global scope (nightmare for analyzers)
    (globalThis as any).__authService = authService;
  },

  async teardown(): Promise<void> {
    delete (globalThis as any).__authService;
  },
};

// Unused
export type AuthPluginOptions = { jwtSecret: string; tokenTtl: number };
export const AUTH_PLUGIN_VERSION = "1.0.0";
