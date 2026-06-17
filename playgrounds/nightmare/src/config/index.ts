import { z } from "zod";

export const FeatureFlagsSchema = z.object({
  enableDynamicImports: z.boolean().default(true),
  enableCircularDetection: z.boolean().default(false),
  enableBarrelOptimization: z.boolean().default(false),
  enableLegacyCompat: z.boolean().default(false),
  maxCircularDepth: z.number().int().min(1).max(100).default(10),
});

export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>;

export const GlobalConfigSchema = z.object({
  env: z.enum(["development", "staging", "production"]).default("development"),
  version: z.string().default("1.0.0"),
  debug: z.boolean().default(false),
  features: FeatureFlagsSchema,
  plugins: z.array(z.string()).default([]),
  adapters: z.record(z.string(), z.unknown()).default({}),
});

export type GlobalConfig = z.infer<typeof GlobalConfigSchema>;

export const defaultConfig: GlobalConfig = GlobalConfigSchema.parse({
  env: "development",
  version: "1.0.0",
  debug: true,
  features: {
    enableDynamicImports: true,
    enableCircularDetection: true,
    enableBarrelOptimization: false,
    enableLegacyCompat: true,
    maxCircularDepth: 5,
  },
  plugins: ["core", "auth", "storage"],
  adapters: {},
});

// Unused exports
export const CONFIG_VERSION = "4.3.0";
export const CONFIG_SCHEMA_URL = "https://example.com/schema/config.json";

export function validateConfig(raw: unknown): GlobalConfig {
  return GlobalConfigSchema.parse(raw);
}

// Unused
export function mergeConfig(base: GlobalConfig, override: Partial<GlobalConfig>): GlobalConfig {
  return { ...base, ...override, features: { ...base.features, ...override.features } };
}

export const ENVIRONMENTS = ["development", "staging", "production"] as const;
export type Environment = (typeof ENVIRONMENTS)[number];
