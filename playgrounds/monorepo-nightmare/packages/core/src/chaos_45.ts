export const data_45 = { id: 45, type: 'chaos' };
export const proxy_45 = new Proxy(data_45, { get: (t, p) => t[p] });
// ❌ GHOST EXPORT (Only accessed via string at runtime)
export const hidden_45 = 'you cant find me';
