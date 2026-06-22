export const data_36 = { id: 36, type: 'chaos' };
export const proxy_36 = new Proxy(data_36, { get: (t, p) => t[p] });
// ❌ GHOST EXPORT (Only accessed via string at runtime)
export const hidden_36 = 'you cant find me';
