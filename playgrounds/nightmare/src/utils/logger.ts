export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

export interface Logger {
  debug(msg: string, ctx?: Record<string, unknown>): void;
  info(msg: string, ctx?: Record<string, unknown>): void;
  warn(msg: string, ctx?: Record<string, unknown>): void;
  error(msg: string, ctx?: Record<string, unknown>): void;
  fatal(msg: string, ctx?: Record<string, unknown>): void;
  child(ctx: Record<string, unknown>): Logger;
}

class ConsoleLogger implements Logger {
  constructor(private ctx: Record<string, unknown> = {}) {}

  private log(level: LogLevel, msg: string, ctx?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level,
      message: msg,
      timestamp: new Date(),
      context: { ...this.ctx, ...ctx },
    };
    const fn = level === "error" || level === "fatal" ? console.error : console.log;
    fn(JSON.stringify(entry));
  }

  debug(msg: string, ctx?: Record<string, unknown>): void { this.log("debug", msg, ctx); }
  info(msg: string, ctx?: Record<string, unknown>): void { this.log("info", msg, ctx); }
  warn(msg: string, ctx?: Record<string, unknown>): void { this.log("warn", msg, ctx); }
  error(msg: string, ctx?: Record<string, unknown>): void { this.log("error", msg, ctx); }
  fatal(msg: string, ctx?: Record<string, unknown>): void { this.log("fatal", msg, ctx); }
  child(ctx: Record<string, unknown>): Logger { return new ConsoleLogger({ ...this.ctx, ...ctx }); }
}

export const logger: Logger = new ConsoleLogger();

// Unused
export function createLogger(ctx: Record<string, unknown>): Logger {
  return new ConsoleLogger(ctx);
}

export const LOG_LEVELS: LogLevel[] = ["debug", "info", "warn", "error", "fatal"];
export const NULL_LOGGER: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {},
  child: () => NULL_LOGGER,
};
