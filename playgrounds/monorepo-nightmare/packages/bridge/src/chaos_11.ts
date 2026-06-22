export const data_11 = { id: 11, type: 'chaos' };
export const proxy_11 = new Proxy(data_11, { get: (t, p) => t[p] });
