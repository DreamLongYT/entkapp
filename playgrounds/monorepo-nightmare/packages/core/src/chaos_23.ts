export const data_23 = { id: 23, type: 'chaos' };
export const proxy_23 = new Proxy(data_23, { get: (t, p) => t[p] });
