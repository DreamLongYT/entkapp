// CIRCULAR: pipeline -> registry -> pipeline
import { Registry } from "./registry.js";
// CIRCULAR: pipeline -> scheduler -> pipeline
import { Scheduler } from "./scheduler.js";
import type { Result } from "../types/errors.js";

export type Middleware<T = unknown> = (
  input: T,
  next: (input: T) => Promise<T>
) => Promise<T>;

export type PipelineStage = {
  name: string;
  middleware: Middleware;
  priority: number;
};

export class Pipeline {
  private stages: PipelineStage[] = [];
  private scheduler?: Scheduler;

  constructor(private registry: Registry) {
    this.registry.setPipeline(this);
  }

  use(stage: PipelineStage): this {
    this.stages.push(stage);
    this.stages.sort((a, b) => a.priority - b.priority);
    return this;
  }

  remove(name: string): boolean {
    const idx = this.stages.findIndex((s) => s.name === name);
    if (idx === -1) return false;
    this.stages.splice(idx, 1);
    return true;
  }

  async initialize(): Promise<void> {
    this.scheduler = new Scheduler(this);
    await this.scheduler.start();
  }

  async run<T>(input: T): Promise<Result<T>> {
    let current = input;
    for (const stage of this.stages) {
      try {
        current = await stage.middleware(current, async (v) => v) as T;
      } catch (e) {
        return { ok: false, error: { code: "INTERNAL_ERROR", message: String(e) } };
      }
    }
    return { ok: true, value: current };
  }

  getStages(): PipelineStage[] {
    return [...this.stages];
  }

  // Unused
  private _debugStages(): string[] {
    return this.stages.map((s) => s.name);
  }
}

// Unused exports
export function createPipeline(registry: Registry): Pipeline {
  return new Pipeline(registry);
}
export const PIPELINE_VERSION = 2;
