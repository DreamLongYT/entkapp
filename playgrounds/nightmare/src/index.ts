// ============================================================
// NIGHTMARE ENTRY POINT
// Re-exports everything, used exports, unused exports, the works
// ============================================================

// Core barrel re-exports
export * from "./core/index.js";
export * from "./utils/index.js";
export * from "./services/index.js";

// Named selective re-exports (some used, some not)
export { PluginManager, type IPlugin, registerPlugin } from "./plugins/index.js";
export { AdapterRegistry } from "./adapters/index.js";
export { ModelFactory, type ModelDefinition } from "./models/index.js";
export { StoreManager, createStore } from "./store/index.js";
export type { GlobalConfig, FeatureFlags } from "./config/index.js";

// Dynamic import wrapper – forces both engines to trace runtime paths
export async function loadDynamicModule(name: string) {
  const mod = await import(`./dynamic/${name}.js`);
  return mod;
}

// Conditional export based on environment
export const isProduction = process.env.NODE_ENV === "production";
export const runtimeConfig = isProduction
  ? { mode: "prod", debug: false }
  : { mode: "dev", debug: true };

// Computed key export – nightmare for static analysis
const _exportKey = "computedExport" as const;
export const exports_map = {
  [_exportKey]: () => import("./dynamic/computed.js"),
  ["lazy_" + "service"]: () => import("./services/lazy.js"),
};

// Re-export default from circular chain entry
export { default as CircularRoot } from "./circular/root.js";

// Unused export that looks used (aliased but never consumed)
export { ghostExport as _ghost } from "./utils/ghost.js";

// Type-only export namespace
export type * from "./types/index.js";
