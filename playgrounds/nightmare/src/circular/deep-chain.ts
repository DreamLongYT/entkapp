// Deep circular chain: A -> B -> C -> D -> E -> A
// Completely separate from the root/node-a/b/c chain

export interface ChainNode {
  id: string;
  next?: ChainNode;
  prev?: ChainNode;
}

// Forward declaration pattern – nightmare for analyzers
export class ChainA {
  b?: ChainB;
  id = "A";
  link(b: ChainB): void { this.b = b; b.a = this; }
  traverse(): string[] { return ["A", ...(this.b?.traverse() ?? [])]; }
}

export class ChainB {
  a?: ChainA;
  c?: ChainC;
  id = "B";
  traverse(): string[] { return ["B", ...(this.c?.traverse() ?? [])]; }
}

export class ChainC {
  b?: ChainB;
  d?: ChainD;
  id = "C";
  traverse(): string[] { return ["C", ...(this.d?.traverse() ?? [])]; }
}

export class ChainD {
  c?: ChainC;
  e?: ChainE;
  id = "D";
  traverse(): string[] { return ["D", ...(this.e?.traverse() ?? [])]; }
}

export class ChainE {
  d?: ChainD;
  a?: ChainA; // CIRCULAR: E -> A
  id = "E";
  traverse(): string[] {
    // Would cause infinite loop – nightmare!
    return ["E", ...(this.a ? ["[back to A]"] : [])];
  }
}

// Factory that creates the full circular chain
export function createDeepChain(): ChainA {
  const a = new ChainA();
  const b = new ChainB();
  const c = new ChainC();
  const d = new ChainD();
  const e = new ChainE();

  a.b = b; b.a = a;
  b.c = c; c.b = b;
  c.d = d; d.c = c;
  d.e = e; e.d = d;
  e.a = a; // CLOSES THE CIRCLE

  return a;
}

// Unused
export type ChainStats = { nodes: number; cycles: number; depth: number };
export function analyzeChain(_root: ChainA): ChainStats {
  return { nodes: 5, cycles: 1, depth: 5 };
}
