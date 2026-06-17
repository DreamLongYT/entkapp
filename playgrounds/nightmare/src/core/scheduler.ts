// CIRCULAR: scheduler -> pipeline -> scheduler
import type { Pipeline } from "./pipeline.js";

export type TaskFn = () => void | Promise<void>;
export type ScheduledTask = {
  id: string;
  fn: TaskFn;
  interval: number;
  lastRun?: Date;
  nextRun: Date;
};

export class Scheduler {
  private tasks = new Map<string, ScheduledTask>();
  private timers = new Map<string, ReturnType<typeof setInterval>>();
  private running = false;

  constructor(private pipeline: Pipeline) {}

  schedule(id: string, fn: TaskFn, intervalMs: number): void {
    this.tasks.set(id, {
      id,
      fn,
      interval: intervalMs,
      nextRun: new Date(Date.now() + intervalMs),
    });
  }

  unschedule(id: string): boolean {
    const timer = this.timers.get(id);
    if (timer) clearInterval(timer);
    this.timers.delete(id);
    return this.tasks.delete(id);
  }

  async start(): Promise<void> {
    this.running = true;
    for (const [id, task] of this.tasks) {
      const timer = setInterval(async () => {
        task.lastRun = new Date();
        task.nextRun = new Date(Date.now() + task.interval);
        await task.fn();
        // CIRCULAR: calls back into pipeline
        await this.pipeline.run({ schedulerTick: id });
      }, task.interval);
      this.timers.set(id, timer);
    }
  }

  stop(): void {
    this.running = false;
    for (const timer of this.timers.values()) clearInterval(timer);
    this.timers.clear();
  }

  isRunning(): boolean {
    return this.running;
  }

  // Unused
  dumpTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }
}

// Unused exports
export const DEFAULT_INTERVAL = 5000;
export type CronExpression = string;
export function parseCron(_expr: CronExpression): number {
  return DEFAULT_INTERVAL;
}
