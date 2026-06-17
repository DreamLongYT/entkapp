import type { DeepPartial } from "../types/index.js";

export function deepMerge<T extends object>(target: T, source: DeepPartial<T>): T {
  const result = { ...target };
  for (const key in source) {
    const val = source[key as keyof typeof source];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      (result as any)[key] = deepMerge((target as any)[key] ?? {}, val as any);
    } else if (val !== undefined) {
      (result as any)[key] = val;
    }
  }
  return result;
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return keys.reduce((acc, k) => ({ ...acc, [k]: obj[k] }), {} as Pick<T, K>);
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const k of keys) delete result[k];
  return result as Omit<T, K>;
}

export function mapValues<T extends object, U>(
  obj: T,
  fn: (value: T[keyof T], key: keyof T) => U
): Record<keyof T, U> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, fn(v, k as keyof T)])
  ) as Record<keyof T, U>;
}

// Unused
export function invert<K extends string, V extends string>(
  obj: Record<K, V>
): Record<V, K> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k])) as Record<V, K>;
}

export function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && Object.getPrototypeOf(val) === Object.prototype;
}

export const EMPTY_OBJECT: Readonly<Record<string, never>> = Object.freeze({});
