export const data_4 = { id: 4, type: 'chaos' };
export const proxy_4 = new Proxy(data_4, { get: (t, p) => t[p] });
