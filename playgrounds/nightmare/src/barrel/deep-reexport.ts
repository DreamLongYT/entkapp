// Deep re-export chain: this file re-exports from files that re-export from files...
// Level 1 -> Level 2 -> Level 3 -> Level 4 -> Level 5

// Level 1: re-export from barrel/index (which re-exports from everywhere)
export { BARREL_VERSION, ALL_MODULES } from "./index.js";

// Level 2: re-export from selective (which re-exports from services)
export { SELECTIVE_BARREL_MARKER } from "./selective.js";

// Level 3: re-export from types (which re-exports from types/index)
export type { AnyFunction, AnyObject, Primitive } from "./types.js";

// Level 4: re-export specific things that were already re-exported multiple times
export {
  Engine as DeepEngine,
  ENGINE_VERSION as DeepEngineVersion,
} from "../core/engine.js";

export {
  Registry as DeepRegistry,
} from "../core/registry.js";

// Level 5: re-export from dynamic (which itself has dynamic imports)
export { ComputedModule as DeepComputed, COMPUTED_KEYS } from "../dynamic/computed.js";

// Self-referential re-export (barrel -> barrel)
export { BARREL_VERSION as DEEP_BARREL_VERSION } from "./index.js";

// Unused
export const DEEP_REEXPORT_DEPTH = 5;
export type ReexportChain = { depth: number; modules: string[] };
