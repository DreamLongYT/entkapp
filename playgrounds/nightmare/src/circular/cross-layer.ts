// Cross-layer circular dependency:
// circular/cross-layer -> store -> event-service -> core/events -> circular/cross-layer
// This crosses multiple architectural layers!

import { Store, createStore } from "../store/index.js";
import { eventService } from "../services/event-service.js";
import { generateUUID } from "../utils/crypto.js";
import type { DomainEvent } from "../types/events.js";

export class CrossLayerOrchestrator {
  private store: Store<{ events: DomainEvent[]; count: number }>;

  constructor() {
    this.store = createStore({
      name: "cross-layer-orchestrator",
      initialState: { events: [], count: 0 },
    });

    // Subscribe to events and update store (store -> event-service -> core/events -> back here)
    eventService.subscribe("store.updated", (event) => {
      const state = this.store.getState();
      this.store.setState({
        events: [...state.events, event as DomainEvent],
        count: state.count + 1,
      });
    });
  }

  dispatch(type: DomainEvent["type"], payload: unknown): void {
    eventService.publish({
      id: generateUUID(),
      type,
      payload,
      timestamp: new Date(),
    });
  }

  getHistory(): DomainEvent[] {
    return this.store.getState().events;
  }

  // Unused
  reset(): void {
    this.store.reset();
  }
}

export const crossLayerOrchestrator = new CrossLayerOrchestrator();
// Unused
export type OrchestratorConfig = { maxHistory: number; debounceMs: number };
