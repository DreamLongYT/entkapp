// Only loaded dynamically – never statically imported
// Both engines should flag this as "only dynamically reachable"

export function experimentalFeature(input: unknown): unknown {
  console.warn("Using experimental feature!");
  return input;
}

export class ExperimentalProcessor {
  process(data: unknown): unknown {
    return experimentalFeature(data);
  }
}

// Unused even within this file
export const EXPERIMENTAL_VERSION = "0.0.1-alpha";
export type ExperimentalConfig = { unsafe: true; version: string };
