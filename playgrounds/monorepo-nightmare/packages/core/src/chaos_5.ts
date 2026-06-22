export const data_5 = { id: 5, type: 'chaos' };
export const proxy_5 = new Proxy(data_5, { get: (t, p) => t[p] });
