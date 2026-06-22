export const data_22 = { id: 22, type: 'chaos' };
export const proxy_22 = new Proxy(data_22, { get: (t, p) => t[p] });
