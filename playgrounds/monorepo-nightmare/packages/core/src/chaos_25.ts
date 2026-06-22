export const data_25 = { id: 25, type: 'chaos' };
export const proxy_25 = new Proxy(data_25, { get: (t, p) => t[p] });
