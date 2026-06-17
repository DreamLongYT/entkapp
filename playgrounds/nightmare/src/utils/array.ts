export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export function flatten<T>(arr: (T | T[])[]): T[] {
  return arr.flat() as T[];
}

export function groupBy<T, K extends string | number | symbol>(
  arr: T[],
  key: (item: T) => K
): Record<K, T[]> {
  return arr.reduce(
    (acc, item) => {
      const k = key(item);
      if (!acc[k]) acc[k] = [];
      acc[k].push(item);
      return acc;
    },
    {} as Record<K, T[]>
  );
}

export function zip<A, B>(a: A[], b: B[]): [A, B][] {
  return a.map((v, i) => [v, b[i]]);
}

// Unused
export function rotate<T>(arr: T[], n: number): T[] {
  const len = arr.length;
  const shift = ((n % len) + len) % len;
  return [...arr.slice(shift), ...arr.slice(0, shift)];
}

export function intersection<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b);
  return a.filter((v) => setB.has(v));
}

export function difference<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b);
  return a.filter((v) => !setB.has(v));
}

export const EMPTY_ARRAY: readonly never[] = [] as const;
