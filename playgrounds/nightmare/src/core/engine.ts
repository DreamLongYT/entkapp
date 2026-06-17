import type { GlobalConfig } from "../config/index.js";
import { Registry } from "./registry.js";
import { Pipeline } from "./pipeline.js";
import { LifecycleManager } from "./lifecycle.js";
import { ContextManager } from "./context.js";
// CIRCULAR: engine -> resolver -> engine (via registry)
import { Resolver } from "./resolver.js";
import type { Result } from "../types/errors.js";
import type { DomainEvent } from "../types/events.js";

export class Engine {
  private static instance: Engine | null = null;
  private registry: Registry;
  private pipeline: Pipeline;
  private lifecycle: LifecycleManager;
  private context: ContextManager;
  private resolver: Resolver;

  private constructor(private config: GlobalConfig) {
    this.registry = new Registry();
    this.pipeline = new Pipeline(this.registry);
    this.lifecycle = new LifecycleManager();
    this.context = new ContextManager(this.config);
    this.resolver = new Resolver(this.registry, this);
  }

  static getInstance(config?: GlobalConfig): Engine {
    if (!Engine.instance) {
      if (!config) throw new Error("Config required for first init");
      Engine.instance = new Engine(config);
    }
    return Engine.instance;
  }

  static resetInstance(): void {
    Engine.instance = null;
  }

  async start(): Promise<Result<void>> {
    await this.lifecycle.onStart();
    await this.pipeline.initialize();
    return { ok: true, value: undefined };
  }

  async stop(): Promise<Result<void>> {
    await this.lifecycle.onStop();
    return { ok: true, value: undefined };
  }

  emit(event: DomainEvent): void {
    this.context.dispatch(event);
  }

  resolve<T>(token: string): T {
    return this.resolver.resolve<T>(token);
  }

  // Unused method – should be flagged
  private _internalDebugDump(): object {
    return {
      registry: this.registry,
      pipeline: this.pipeline,
    };
  }
}

// Unused export
export const ENGINE_VERSION = "4.3.0-nightmare";
export const _unusedEngineFlag = Symbol("unused");
