// Mutual circular dependency: mutual.ts <-> mutual-partner.ts
import type { MutualPartner } from "./mutual-partner.js";

export class Mutual {
  partner?: MutualPartner;

  setPartner(p: MutualPartner): void {
    this.partner = p;
    p.mutual = this;
  }

  greet(): string {
    return `Mutual says hi to ${this.partner?.name ?? "nobody"}`;
  }

  // Unused
  describe(): string {
    return "I am Mutual in a circular dependency";
  }
}

export const mutual = new Mutual();
export type MutualConfig = { bidirectional: true };
