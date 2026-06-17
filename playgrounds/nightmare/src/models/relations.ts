// CIRCULAR: relations -> circular-store -> models -> relations
import type { ModelStore } from "../store/circular-store.js";
import type { User, Session } from "./index.js";
import type { BaseEntity } from "../types/index.js";

export interface Relation<TSource extends BaseEntity, TTarget extends BaseEntity> {
  source: string;
  target: string;
  type: "one-to-one" | "one-to-many" | "many-to-many";
  foreignKey: string;
}

export class RelationManager {
  private relations: Relation<any, any>[] = [];
  private stores = new Map<string, ModelStore<any>>();

  define<S extends BaseEntity, T extends BaseEntity>(relation: Relation<S, T>): void {
    this.relations.push(relation);
  }

  registerStore<T extends BaseEntity>(name: string, store: ModelStore<T>): void {
    this.stores.set(name, store);
  }

  // Circular: uses ModelStore which uses models
  async resolve<S extends BaseEntity, T extends BaseEntity>(
    sourceId: string,
    relation: Relation<S, T>
  ): Promise<T[]> {
    const targetStore = this.stores.get(relation.target);
    if (!targetStore) return [];
    return targetStore.getItems().filter(
      (item: any) => item[relation.foreignKey] === sourceId
    );
  }

  // Unused
  getRelations(): Relation<any, any>[] {
    return [...this.relations];
  }
}

export const relationManager = new RelationManager();

// Pre-defined relations
relationManager.define<User, Session>({
  source: "User",
  target: "Session",
  type: "one-to-many",
  foreignKey: "userId",
});

// Unused
export type RelationType = Relation<any, any>["type"];
export const RELATION_VERSION = 1;
