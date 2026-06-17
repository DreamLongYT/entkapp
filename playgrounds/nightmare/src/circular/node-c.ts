// CIRCULAR: node-c -> root -> node-a -> node-b -> node-c
import type { NodeB } from "./node-b.js";
import type CircularRoot from "./root.js";
import type { ChainMeta } from "./meta.js";

export class NodeC {
  private rootRef: CircularRoot | null = null;

  constructor(private nodeB: NodeB) {}

  setRoot(root: CircularRoot): void {
    this.rootRef = root;
  }

  getMeta(): ChainMeta {
    return { depth: 3, name: "node-c", children: [] };
  }

  ping(): string {
    if (this.rootRef) {
      // Would cause infinite loop at runtime – nightmare!
      return `c -> [root-ref:${typeof this.rootRef}]`;
    }
    return "c -> [no root]";
  }

  getNodeB(): NodeB {
    return this.nodeB;
  }

  // Unused
  static fromRoot(root: CircularRoot, nodeB: NodeB): NodeC {
    const c = new NodeC(nodeB);
    c.setRoot(root);
    return c;
  }
}

// Unused exports
export const NODE_C_VERSION = 3;
export type NodeCState = "idle" | "active" | "error";
