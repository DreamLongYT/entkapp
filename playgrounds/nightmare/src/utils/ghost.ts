// Ghost exports – exported but never consumed anywhere meaningful
// Both engines should flag these

export function ghostExport(): void {
  console.log("I am a ghost");
}

export function anotherGhost(x: number): number {
  return x * 2;
}

export class GhostClass {
  phantom = true;
  haunt(): string { return "boo"; }
}

export const GHOST_CONSTANT = "👻" as const;
export type GhostType = { phantom: true; value: never };

// Re-exported from index but never actually used downstream
export function ghostHelper(a: string, b: string): string {
  return `${a}::${b}`;
}

// This one IS used (in index.ts re-export), but the alias _ghost is unused
export { ghostExport };
