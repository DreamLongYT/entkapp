export const data_10 = { id: 10, type: 'chaos' };
export const proxy_10 = new Proxy(data_10, { get: (t, p) => t[p] });
// ❌ TRULY DEAD
export const void_10 = null;
