// ============================================================
// TYPE NIGHTMARE – re-exported, merged, augmented, never used
// ============================================================

export type ID = string | number;
export type Nullable<T> = T | null;
export type Maybe<T> = T | null | undefined;
export type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> };
export type DeepRequired<T> = { [K in keyof T]-?: DeepRequired<T[K]> };
export type Awaited<T> = T extends Promise<infer U> ? U : T;
export type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never;
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

// Phantom type – purely structural, never instantiated
export type Brand<T, B extends string> = T & { readonly __brand: B };
export type UserId = Brand<string, "UserId">;
export type SessionId = Brand<string, "SessionId">;
export type RequestId = Brand<string, "RequestId">;

// Recursive type – stack-overflow bait for naive analyzers
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

// Conditional type chains
export type IsArray<T> = T extends any[] ? true : false;
export type IsPromise<T> = T extends Promise<any> ? true : false;
export type Flatten<T> = T extends (infer U)[] ? U : T;
export type Head<T extends any[]> = T extends [infer H, ...any[]] ? H : never;
export type Tail<T extends any[]> = T extends [any, ...infer T] ? T : never;

// Module augmentation – nightmare for dependency trackers
declare module "../config/index.js" {
  interface GlobalConfig {
    __augmented: true;
    extraField: string;
  }
}

// Unused types (should be flagged)
export type NeverUsedType = { phantom: true; value: never };
export type AlsoNeverUsed = Map<string, NeverUsedType>;

// Interface merging chain
export interface BaseEntity {
  id: ID;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditableEntity extends BaseEntity {
  createdBy: UserId;
  updatedBy: UserId;
  version: number;
}

export interface SoftDeletable extends AuditableEntity {
  deletedAt: Date | null;
  deletedBy: UserId | null;
}

// Re-export from sub-type modules
export type * from "./events.js";
export type * from "./errors.js";
export type * from "./pagination.js";
