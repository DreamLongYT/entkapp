// Database adapter – unused but exported
import type { Adapter } from "./index.js";
import { logger } from "../utils/logger.js";

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

export interface DatabaseClient {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  execute(sql: string, params?: unknown[]): Promise<{ rowsAffected: number }>;
  transaction<T>(fn: (client: DatabaseClient) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export class DatabaseAdapter implements Adapter<DatabaseConfig, DatabaseClient> {
  name = "database";
  type = "database";
  private client: DatabaseClient | null = null;

  async connect(config: DatabaseConfig): Promise<DatabaseClient> {
    logger.info("Connecting to database", { host: config.host, db: config.database });
    // Mock client
    this.client = {
      async query<T>(_sql: string, _params?: unknown[]): Promise<T[]> { return []; },
      async execute(_sql: string, _params?: unknown[]) { return { rowsAffected: 0 }; },
      async transaction<T>(fn: (c: DatabaseClient) => Promise<T>): Promise<T> { return fn(this as DatabaseClient); },
      async close() {},
    };
    return this.client;
  }

  async disconnect(): Promise<void> {
    await this.client?.close();
    this.client = null;
  }

  isConnected(): boolean {
    return this.client !== null;
  }

  // Unused
  async ping(): Promise<boolean> {
    if (!this.client) return false;
    try {
      await this.client.query("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }
}

export const databaseAdapter = new DatabaseAdapter();
// Unused
export type QueryBuilder = { select: string[]; from: string; where?: string; limit?: number };
export const DB_DRIVERS = ["postgres", "mysql", "sqlite", "mssql"] as const;
