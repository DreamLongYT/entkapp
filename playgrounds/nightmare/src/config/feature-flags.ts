// Feature flags – dynamically computed exports based on environment
import { defaultConfig } from "./index.js";

// Dynamic flag resolution
const _flags = defaultConfig.features;

// Computed exports based on flag values – nightmare for static analysis
export const FLAGS: Record<string, boolean> = {};
for (const [key, value] of Object.entries(_flags)) {
  FLAGS[key] = Boolean(value);
  // Also export each flag individually via Object.defineProperty
  Object.defineProperty(exports, `flag_${key}`, {
    get: () => FLAGS[key],
    enumerable: true,
  });
}

// Static exports
export const ENABLE_DYNAMIC_IMPORTS = _flags.enableDynamicImports;
export const ENABLE_CIRCULAR_DETECTION = _flags.enableCircularDetection;
export const ENABLE_BARREL_OPTIMIZATION = _flags.enableBarrelOptimization;
export const ENABLE_LEGACY_COMPAT = _flags.enableLegacyCompat;
export const MAX_CIRCULAR_DEPTH = _flags.maxCircularDepth;

// Conditional feature modules
export const featureModules = {
  ...(ENABLE_DYNAMIC_IMPORTS && {
    dynamicLoader: () => import("../dynamic/loader.js"),
  }),
  ...(ENABLE_LEGACY_COMPAT && {
    legacyCompat: () => import("../legacy/compat.js"),
  }),
};

// Unused
export type FlagKey = keyof typeof _flags;
export function getFlag(key: FlagKey): boolean {
  return Boolean(_flags[key]);
}
export const FLAG_NAMESPACE = "nightmare.flags" as const;
