// CIRCULAR: mutual-partner -> mutual -> mutual-partner
import type { Mutual } from "./mutual.js";

export class MutualPartner {
  mutual?: Mutual;
  name = "MutualPartner";

  greet(): string {
    return `MutualPartner says hi to ${this.mutual ? "Mutual" : "nobody"}`;
  }

  // Unused
  describe(): string {
    return "I am MutualPartner in a circular dependency";
  }
}

export const mutualPartner = new MutualPartner();
// Unused
export type PartnerConfig = { name: string; bidirectional: boolean };
