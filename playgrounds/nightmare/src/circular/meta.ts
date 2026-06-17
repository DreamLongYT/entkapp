export interface ChainMeta {
  depth: number;
  name: string;
  children: ChainMeta[];
}

// Unused
export function flattenMeta(meta: ChainMeta): string[] {
  return [meta.name, ...meta.children.flatMap(flattenMeta)];
}
