// CIRCULAR: node-a -> node-b -> node-c -> root -> node-a
import type CircularRoot from "./root.js";
import { NodeB } from "./node-b.js";
import type { ChainMeta } from "./meta.js";

export class NodeA {
  private nodeB: NodeB;

  constructor(private root: CircularRoot) {
    this.nodeB = new NodeB(this);
  }

  getMeta(): ChainMeta {
    return { depth: 1, name: "node-a", children: [this.nodeB.getMeta()] };
  }

  ping(): string {
    return `a -> ${this.nodeB.ping()}`;
  }

  getRoot(): CircularRoot {
    return this.root;
  }

  // Unused
  describe(): string {
    return "NodeA in circular chain";
  }
}

export const NODE_A_SYMBOL = Symbol("NodeA");
// Unused
export function createNodeA(root: CircularRoot): NodeA {
  return new NodeA(root);
}
