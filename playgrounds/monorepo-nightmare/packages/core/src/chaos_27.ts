export const data_27 = { id: 27, type: 'chaos' };
export const proxy_27 = new Proxy(data_27, { get: (t, p) => t[p] });
// ❌ GHOST EXPORT (Only accessed via string at runtime)
export const hidden_27 = 'you cant find me';
