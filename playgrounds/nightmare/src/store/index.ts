// CIRCULAR: store -> event-service -> core/events -> store (via dispatch)
import { eventService } from "../services/event-service.js";
import type { DomainEvent } from "../types/events.js";
import { generateUUID } from "../utils/crypto.js";
import type { DeepPartial, Reducer } from "../types/index.js";

export type StoreListener<S> = (state: S, prevState: S) => void;

export interface StoreOptions<S> {
  name: string;
  initialState: S;
  reducer?: Reducer<S, DomainEvent>;
  persist?: boolean;
}

export class Store<S extends object> {
  private state: S;
  private listeners = new Set<StoreListener<S>>();
  private history: S[] = [];

  constructor(private options: StoreOptions<S>) {
    this.state = { ...options.initialState };
  }

  getState(): Readonly<S> {
    return Object.freeze({ ...this.state });
  }

  setState(update: DeepPartial<S>): void {
    const prev = { ...this.state };
    this.state = { ...this.state, ...update } as S;
    this.history.push(prev);
    this.notify(prev);
    // CIRCULAR: store -> event-service
    eventService.publish({
      id: generateUUID(),
      type: "store.updated",
      payload: { name: this.options.name, update },
      timestamp: new Date(),
    });
  }

  dispatch(event: DomainEvent): void {
    if (!this.options.reducer) return;
    const prev = { ...this.state };
    this.state = this.options.reducer(this.state, event);
    this.notify(prev);
  }

  subscribe(listener: StoreListener<S>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(prev: S): void {
    for (const l of this.listeners) l(this.getState() as S, prev);
  }

  // Unused
  undo(): void {
    const prev = this.history.pop();
    if (prev) this.state = prev;
  }

  reset(): void {
    this.state = { ...this.options.initialState };
    this.history = [];
  }
}

export class StoreManager {
  private stores = new Map<string, Store<any>>();

  create<S extends object>(options: StoreOptions<S>): Store<S> {
    const store = new Store(options);
    this.stores.set(options.name, store);
    return store;
  }

  get<S extends object>(name: string): Store<S> | undefined {
    return this.stores.get(name);
  }

  // Unused
  getAll(): Store<any>[] {
    return Array.from(this.stores.values());
  }
}

export function createStore<S extends object>(options: StoreOptions<S>): Store<S> {
  return new Store(options);
}

export const storeManager = new StoreManager();
// Unused
export type StorePlugin<S> = (store: Store<S>) => void;
export const STORE_VERSION = 1;
