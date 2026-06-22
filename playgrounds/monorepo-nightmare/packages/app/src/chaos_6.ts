export const data_6 = { id: 6, type: 'chaos' };
export const proxy_6 = new Proxy(data_6, { get: (t, p) => t[p] });
// ❌ GHOST EXPORT (Only accessed via string at runtime)
export const hidden_6 = 'you cant find me';
