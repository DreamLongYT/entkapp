export const data_21 = { id: 21, type: 'chaos' };
export const proxy_21 = new Proxy(data_21, { get: (t, p) => t[p] });
// ❌ GHOST EXPORT (Only accessed via string at runtime)
export const hidden_21 = 'you cant find me';
