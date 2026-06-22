export const data_12 = { id: 12, type: 'chaos' };
export const proxy_12 = new Proxy(data_12, { get: (t, p) => t[p] });
// ❌ GHOST EXPORT (Only accessed via string at runtime)
export const hidden_12 = 'you cant find me';
