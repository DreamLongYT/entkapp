// Second circular chain: circular-store -> models -> store -> circular-store
import { modelFactory, type ModelDefinition } from "../models/index.js";
import { Store, createStore } from "./index.js";
import type { BaseEntity } from "../types/index.js";
import { z } from "zod";

export class ModelStore<T extends BaseEntity> {
  private store: Store<{ items: T[]; loading: boolean; error: string | null }>;
  private model: ModelDefinition;

  constructor(modelName: string) {
    const model = modelFactory.get(modelName);
    if (!model) throw new Error(`Model "${modelName}" not found`);
    this.model = model;
    this.store = createStore({
      name: `model:${modelName}`,
      initialState: { items: [], loading: false, error: null },
    });
  }

  getItems(): T[] {
    return this.store.getState().items;
  }

  addItem(item: T): void {
    const state = this.store.getState();
    this.store.setState({ items: [...state.items, item] });
  }

  removeItem(id: string): void {
    const state = this.store.getState();
    this.store.setState({ items: state.items.filter((i) => i.id !== id) });
  }

  // Unused
  clear(): void {
    this.store.setState({ items: [] });
  }
}

// Dynamic model store factory
export function createModelStore<T extends BaseEntity>(modelName: string): ModelStore<T> {
  return new ModelStore<T>(modelName);
}

// Unused
export const MODEL_STORE_VERSION = 1;
export type ModelStoreState<T> = { items: T[]; loading: boolean; error: string | null };
