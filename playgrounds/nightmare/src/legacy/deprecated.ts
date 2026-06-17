// @deprecated entire file

/** @deprecated */
export function oldFetchData(url: string): Promise<unknown> {
  return fetch(url).then((r) => r.json());
}

/** @deprecated */
export function oldParseConfig(raw: string): Record<string, unknown> {
  return JSON.parse(raw);
}

/** @deprecated */
export class OldRegistry {
  private items: Record<string, unknown> = {};
  set(key: string, val: unknown): void { this.items[key] = val; }
  get(key: string): unknown { return this.items[key]; }
}

/** @deprecated */
export const OLD_API_URL = "https://api.old.example.com/v1";
/** @deprecated */
export const OLD_TIMEOUT = 10000;
