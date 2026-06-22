export const data_9 = { id: 9, type: 'chaos' };
export const proxy_9 = new Proxy(data_9, { get: (t, p) => t[p] });
// ❌ GHOST EXPORT (Only accessed via string at runtime)
export const hidden_9 = 'you cant find me';
