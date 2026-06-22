export const data_7 = { id: 7, type: 'chaos' };
export const proxy_7 = new Proxy(data_7, { get: (t, p) => t[p] });
