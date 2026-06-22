export const data_1 = { id: 1, type: 'chaos' };
export const proxy_1 = new Proxy(data_1, { get: (t, p) => t[p] });
