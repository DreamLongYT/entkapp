export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function camelToKebab(s: string): string {
  return s.replace(/([A-Z])/g, "-$1").toLowerCase();
}

export function kebabToCamel(s: string): string {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export function truncate(s: string, maxLen: number, ellipsis = "..."): string {
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - ellipsis.length) + ellipsis;
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// Unused
export function reverseString(s: string): string {
  return s.split("").reverse().join("");
}

export function countWords(s: string): number {
  return s.trim().split(/\s+/).length;
}

export const EMPTY_STRING = "" as const;
export const NBSP = "\u00A0" as const;
