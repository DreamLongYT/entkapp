// Runtime configuration – loaded dynamically based on environment
import { validateConfig, type GlobalConfig } from "./index.js";

type ConfigLoader = () => Promise<GlobalConfig>;

const loaders: Record<string, ConfigLoader> = {
  development: async () => {
    const mod = await import("./envs/development.js");
    return validateConfig(mod.default);
  },
  staging: async () => {
    const mod = await import("./envs/staging.js");
    return validateConfig(mod.default);
  },
  production: async () => {
    const mod = await import("./envs/production.js");
    return validateConfig(mod.default);
  },
};

export async function loadRuntimeConfig(): Promise<GlobalConfig> {
  const env = process.env.NODE_ENV ?? "development";
  const loader = loaders[env];
  if (!loader) throw new Error(`No config loader for env: ${env}`);
  return loader();
}

// Unused
export type RuntimeConfigLoader = ConfigLoader;
export const RUNTIME_CONFIG_VERSION = "2.0.0";
export function createConfigLoader(env: string): ConfigLoader {
  return loaders[env] ?? loaders.development;
}
