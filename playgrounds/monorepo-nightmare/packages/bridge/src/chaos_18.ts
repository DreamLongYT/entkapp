export const data_18 = { id: 18, type: 'chaos' };
export const proxy_18 = new Proxy(data_18, { get: (t, p) => t[p] });
// ❌ GHOST EXPORT (Only accessed via string at runtime)
export const hidden_18 = 'you cant find me';
