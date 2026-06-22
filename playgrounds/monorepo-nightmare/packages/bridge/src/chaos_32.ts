export const data_32 = { id: 32, type: 'chaos' };
export const proxy_32 = new Proxy(data_32, { get: (t, p) => t[p] });
