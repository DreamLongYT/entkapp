export const data_3 = { id: 3, type: 'chaos' };
export const proxy_3 = new Proxy(data_3, { get: (t, p) => t[p] });
// ❌ GHOST EXPORT (Only accessed via string at runtime)
export const hidden_3 = 'you cant find me';
