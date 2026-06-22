export const data_13 = { id: 13, type: 'chaos' };
export const proxy_13 = new Proxy(data_13, { get: (t, p) => t[p] });
