// MEGA BARREL – re-exports everything from everywhere
// This is the barrel file nightmare: one file that pulls in ALL modules
// and re-exports them, creating massive import graphs

// Re-export entire public API
export * from "../core/index.js";
export * from "../utils/index.js";
export * from "../services/index.js";
export * from "../plugins/index.js";
export * from "../adapters/index.js";
export * from "../models/index.js";
export * from "../store/index.js";
export * from "../config/index.js";
export * from "../dynamic/index.js";
export type * from "../types/index.js";

// Also re-export the main entry (circular barrel!)
// This creates: barrel -> index -> barrel (via re-exports)
export { loadDynamicModule, runtimeConfig, exports_map } from "../index.js";

// Selective re-exports with renaming (creates alias confusion)
export {
  Engine as CoreEngine,
  ENGINE_VERSION as CORE_VERSION,
} from "../core/engine.js";

export {
  Registry as CoreRegistry,
  createRegistry as newRegistry,
} from "../core/registry.js";

export {
  logger as defaultLogger,
  NULL_LOGGER as silentLogger,
  createLogger as makeLogger,
} from "../utils/logger.js";

// Unused barrel-level exports
export const BARREL_VERSION = "mega-nightmare-1.0";
export const ALL_MODULES = [
  "core", "utils", "services", "plugins",
  "adapters", "models", "store", "config", "dynamic",
] as const;
