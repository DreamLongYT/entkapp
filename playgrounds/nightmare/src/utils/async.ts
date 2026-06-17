export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  attempts: number,
  delayMs = 100
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === attempts - 1) throw e;
      await sleep(delayMs * Math.pow(2, i));
    }
  }
  throw new Error("Unreachable");
}

export function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}

export async function allSettledMap<K extends string, T>(
  map: Record<K, Promise<T>>
): Promise<Record<K, PromiseSettledResult<T>>> {
  const entries = Object.entries(map) as [K, Promise<T>][];
  const results = await Promise.allSettled(entries.map(([, p]) => p));
  return Object.fromEntries(entries.map(([k], i) => [k, results[i]])) as Record<K, PromiseSettledResult<T>>;
}

// Unused
export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function throttle<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let last = 0;
  return ((...args: any[]) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  }) as T;
}

export const noop = (): void => {};
export const identity = <T>(x: T): T => x;
