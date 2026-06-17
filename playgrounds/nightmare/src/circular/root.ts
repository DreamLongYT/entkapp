// CIRCULAR CHAIN: root -> a -> b -> c -> root
import { NodeA } from "./node-a.js";
import type { ChainMeta } from "./meta.js";

export default class CircularRoot {
  private nodeA: NodeA;

  constructor() {
    this.nodeA = new NodeA(this);
  }

  getMeta(): ChainMeta {
    return { depth: 0, name: "root", children: [this.nodeA.getMeta()] };
  }

  ping(): string {
    return `root -> ${this.nodeA.ping()}`;
  }

  // Unused
  static create(): CircularRoot {
    return new CircularRoot();
  }
}

export { CircularRoot };
export const ROOT_TOKEN = Symbol("CircularRoot");
