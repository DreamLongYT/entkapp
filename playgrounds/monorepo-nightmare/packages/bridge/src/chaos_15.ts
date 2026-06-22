export const data_15 = { id: 15, type: 'chaos' };
export const proxy_15 = new Proxy(data_15, { get: (t, p) => t[p] });
// ❌ GHOST EXPORT (Only accessed via string at runtime)
export const hidden_15 = 'you cant find me';
