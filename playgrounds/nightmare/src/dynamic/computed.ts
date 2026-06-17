// This file is imported BOTH statically (via dynamic/index.ts)
// AND dynamically (via computed string in src/index.ts exports_map)
// Maximum nightmare for both engines

import { capitalize, camelToKebab } from "../utils/string.js";
import { memoize } from "../utils/fp.js";

const _prefix = "computed";

// Computed export keys – static analyzers cannot resolve these
export const computedExports: Record<string, unknown> = {};

const exportNames = ["alpha", "beta", "gamma", "delta", "epsilon"] as const;
for (const name of exportNames) {
  computedExports[`${_prefix}_${name}`] = memoize(() => capitalize(name));
  computedExports[camelToKebab(name)] = name;
}

// Named exports that ARE statically analyzable
export function computedTransform(input: string): string {
  return capitalize(camelToKebab(input));
}

export const COMPUTED_KEYS = exportNames.map((n) => `${_prefix}_${n}`);

// Default export
const ComputedModule = {
  transform: computedTransform,
  keys: COMPUTED_KEYS,
  exports: computedExports,
};

export default ComputedModule;

// Unused
export type ComputedKey = (typeof exportNames)[number];
export function getComputedValue(key: ComputedKey): unknown {
  return computedExports[`${_prefix}_${key}`];
}
