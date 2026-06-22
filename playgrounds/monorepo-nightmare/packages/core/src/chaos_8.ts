export const data_8 = { id: 8, type: 'chaos' };
export const proxy_8 = new Proxy(data_8, { get: (t, p) => t[p] });
