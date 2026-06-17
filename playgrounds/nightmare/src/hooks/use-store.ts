// Unused hook – entire hooks directory is dead code
import { Store, storeManager } from "../store/index.js";

export function useStore<S extends object>(name: string): Store<S> | undefined {
  return storeManager.get<S>(name);
}

export function useStoreState<S extends object>(name: string): Readonly<S> | undefined {
  return storeManager.get<S>(name)?.getState();
}

// Unused within unused file
export function useStoreSelector<S extends object, T>(
  name: string,
  selector: (state: Readonly<S>) => T
): T | undefined {
  const state = storeManager.get<S>(name)?.getState();
  return state ? selector(state) : undefined;
}
