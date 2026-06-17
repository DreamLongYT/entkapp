// Shims for old environments

if (typeof globalThis.structuredClone === "undefined") {
  (globalThis as any).structuredClone = (obj: unknown) => JSON.parse(JSON.stringify(obj));
}

export function shimFetch(): void {
  // No-op shim
}

export const hasNativeStructuredClone = typeof globalThis.structuredClone !== "undefined";
export const hasNativePromiseAny = typeof Promise.any !== "undefined";

// Unused
export function applyAllShims(): void {
  shimFetch();
}
