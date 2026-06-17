// CIRCULAR: node-b -> node-c -> root -> node-a -> node-b
import type { NodeA } from "./node-a.js";
import { NodeC } from "./node-c.js";
import type { ChainMeta } from "./meta.js";

export class NodeB {
  private nodeC: NodeC;

  constructor(private nodeA: NodeA) {
    this.nodeC = new NodeC(this);
  }

  getMeta(): ChainMeta {
    return { depth: 2, name: "node-b", children: [this.nodeC.getMeta()] };
  }

  ping(): string {
    return `b -> ${this.nodeC.ping()}`;
  }

  getNodeA(): NodeA {
    return this.nodeA;
  }

  // Unused
  serialize(): string {
    return JSON.stringify(this.getMeta());
  }
}

export const NODE_B_SYMBOL = Symbol("NodeB");
// Unused
export type NodeBConfig = { maxDepth: number; timeout: number };
