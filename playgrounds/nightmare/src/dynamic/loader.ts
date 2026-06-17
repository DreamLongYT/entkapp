// Dynamic loader – loads modules by string path
// Creates a nightmare of unresolvable dynamic imports

export type ModuleLoader<T = unknown> = {
  load(): Promise<T>;
  unload(): void;
  isLoaded(): boolean;
};

export function createModuleLoader<T>(path: string): ModuleLoader<T> {
  let module: T | undefined;

  return {
    async load(): Promise<T> {
      if (!module) {
        // Dynamic import with variable path – unanalyzable
        const mod = await import(/* @vite-ignore */ path);
        module = (mod.default ?? mod) as T;
      }
      return module;
    },
    unload(): void {
      module = undefined;
    },
    isLoaded(): boolean {
      return module !== undefined;
    },
  };
}

// Pre-configured loaders – paths known at compile time but still dynamic
export const coreLoader = createModuleLoader("../core/index.js");
export const servicesLoader = createModuleLoader("../services/index.js");
export const pluginsLoader = createModuleLoader("../plugins/index.js");

// Unused
export type LoaderRegistry = Map<string, ModuleLoader>;
export function createLoaderRegistry(): LoaderRegistry {
  return new Map();
}
