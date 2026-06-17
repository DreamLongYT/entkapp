export type LifecycleHook = () => void | Promise<void>;

export class LifecycleManager {
  private startHooks: LifecycleHook[] = [];
  private stopHooks: LifecycleHook[] = [];
  private errorHooks: Array<(e: Error) => void> = [];

  onStart(hook?: LifecycleHook): Promise<void> | void {
    if (hook) {
      this.startHooks.push(hook);
      return;
    }
    return Promise.all(this.startHooks.map((h) => h())).then(() => {});
  }

  onStop(hook?: LifecycleHook): Promise<void> | void {
    if (hook) {
      this.stopHooks.push(hook);
      return;
    }
    return Promise.all(this.stopHooks.map((h) => h())).then(() => {});
  }

  onError(hook: (e: Error) => void): void {
    this.errorHooks.push(hook);
  }

  handleError(e: Error): void {
    for (const h of this.errorHooks) h(e);
  }

  // Unused
  reset(): void {
    this.startHooks = [];
    this.stopHooks = [];
    this.errorHooks = [];
  }
}

// Unused
export const LIFECYCLE_EVENTS = ["start", "stop", "error", "restart"] as const;
export type LifecycleEvent = (typeof LIFECYCLE_EVENTS)[number];
