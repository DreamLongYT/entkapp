export const data_2 = { id: 2, type: 'chaos' };
export const proxy_2 = new Proxy(data_2, { get: (t, p) => t[p] });
