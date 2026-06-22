export const data_16 = { id: 16, type: 'chaos' };
export const proxy_16 = new Proxy(data_16, { get: (t, p) => t[p] });
