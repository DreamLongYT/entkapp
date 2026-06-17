// Type-only barrel – re-exports all types
// Creates confusion with the main types/index.ts

export type * from "../types/index.js";
export type * from "../types/events.js";
export type * from "../types/errors.js";
export type * from "../types/pagination.js";
export type { GlobalConfig, FeatureFlags, Environment } from "../config/index.js";
export type { IPlugin, PluginMeta, PluginFactory } from "../plugins/index.js";
export type { Adapter, AdapterType } from "../adapters/index.js";
export type { ModelDefinition, User, Session } from "../models/index.js";
export type { StoreOptions, StoreListener } from "../store/index.js";

// Unused type aliases
export type AnyFunction = (...args: any[]) => any;
export type AnyObject = Record<string, unknown>;
export type AnyArray = unknown[];
export type Primitive = string | number | boolean | null | undefined;
