// Functional programming utilities – some used, many not

export const pipe = <T>(...fns: Array<(x: T) => T>) => (x: T): T =>
  fns.reduce((v, f) => f(v), x);

export const compose = <T>(...fns: Array<(x: T) => T>) => (x: T): T =>
  fns.reduceRight((v, f) => f(v), x);

export const curry =
  <A, B, C>(fn: (a: A, b: B) => C) =>
  (a: A) =>
  (b: B): C =>
    fn(a, b);

export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map<string, ReturnType<T>>();
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key)!;
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// Unused
export const always = <T>(x: T) => (): T => x;
export const flip = <A, B, C>(fn: (a: A, b: B) => C) => (b: B, a: A): C => fn(a, b);
export const tap = <T>(fn: (x: T) => void) => (x: T): T => { fn(x); return x; };
export const not = <T extends (...args: any[]) => boolean>(fn: T) =>
  (...args: Parameters<T>): boolean => !fn(...args);

export type Fn<A, B> = (a: A) => B;
export type Predicate<T> = (x: T) => boolean;
export type Reducer<S, A> = (state: S, action: A) => S;
