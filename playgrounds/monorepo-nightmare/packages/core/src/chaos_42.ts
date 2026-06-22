export const data_42 = { id: 42, type: 'chaos' };
export const proxy_42 = new Proxy(data_42, { get: (t, p) => t[p] });
// ❌ GHOST EXPORT (Only accessed via string at runtime)
export const hidden_42 = 'you cant find me';
