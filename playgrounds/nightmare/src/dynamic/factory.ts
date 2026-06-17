// Dynamic factory – creates modules at runtime
// Exports are conditionally defined based on runtime values

const FEATURE_FLAGS = {
  enableV2: process.env.FEATURE_V2 === "true",
  enableExperimental: process.env.FEATURE_EXPERIMENTAL === "true",
};

// Conditional exports – nightmare for static analysis
export const featureFactory = FEATURE_FLAGS.enableV2
  ? {
      create: (name: string) => ({ name, version: 2 }),
      createBatch: (names: string[]) => names.map((n) => ({ name: n, version: 2 })),
    }
  : {
      create: (name: string) => ({ name, version: 1 }),
    };

// Dynamic export via Object.assign
const _base = { factoryVersion: 1 };
export const dynamicFactory = Object.assign(_base, {
  ...(FEATURE_FLAGS.enableExperimental && {
    experimental: () => import("./experimental.js"),
  }),
});

// Re-export with computed names
const _exports: Record<string, unknown> = {};
["alpha", "beta", "gamma"].forEach((key, i) => {
  _exports[`factory_${key}`] = () => ({ key, index: i });
});
export { _exports as factoryExports };

// Unused
export type FactoryOptions = {
  version: 1 | 2;
  experimental: boolean;
};
export const FACTORY_NAMESPACE = "dynamic.factory" as const;
