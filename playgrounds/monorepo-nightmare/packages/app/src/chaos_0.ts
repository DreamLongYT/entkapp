export const data_0 = { id: 0, type: 'chaos' };
export const proxy_0 = new Proxy(data_0, { get: (t, p) => t[p] });
// ❌ GHOST EXPORT (Only accessed via string at runtime)
export const hidden_0 = 'you cant find me';
// ❌ TRULY DEAD
export const void_0 = null;
