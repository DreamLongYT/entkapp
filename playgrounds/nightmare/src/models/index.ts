import { z } from "zod";
import type { BaseEntity, AuditableEntity } from "../types/index.js";
import { generateUUID } from "../utils/crypto.js";

export type ModelDefinition<T extends z.ZodTypeAny = z.ZodTypeAny> = {
  name: string;
  schema: T;
  tableName: string;
  primaryKey: string;
};

export class ModelFactory {
  private models = new Map<string, ModelDefinition>();

  define<T extends z.ZodTypeAny>(def: ModelDefinition<T>): ModelDefinition<T> {
    this.models.set(def.name, def as ModelDefinition);
    return def;
  }

  get<T extends z.ZodTypeAny>(name: string): ModelDefinition<T> | undefined {
    return this.models.get(name) as ModelDefinition<T> | undefined;
  }

  // Dynamic model creation – nightmare for static analysis
  createFromSchema(name: string, schema: z.ZodTypeAny): ModelDefinition {
    return this.define({ name, schema, tableName: name.toLowerCase(), primaryKey: "id" });
  }

  // Unused
  list(): string[] {
    return Array.from(this.models.keys());
  }
}

export const modelFactory = new ModelFactory();

// Pre-defined models
export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3).max(50),
  email: z.string().email(),
  passwordHash: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema> & BaseEntity;

export const SessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  token: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Session = z.infer<typeof SessionSchema>;

// Dynamic model definitions via computed keys
const MODEL_NAMES = ["user", "session", "audit_log", "settings"] as const;
export const MODELS: Record<(typeof MODEL_NAMES)[number], ModelDefinition> = {
  user: modelFactory.define({ name: "User", schema: UserSchema, tableName: "users", primaryKey: "id" }),
  session: modelFactory.define({ name: "Session", schema: SessionSchema, tableName: "sessions", primaryKey: "id" }),
  audit_log: modelFactory.define({ name: "AuditLog", schema: z.object({ id: z.string(), action: z.string(), userId: z.string(), timestamp: z.date() }), tableName: "audit_logs", primaryKey: "id" }),
  settings: modelFactory.define({ name: "Settings", schema: z.object({ key: z.string(), value: z.unknown(), userId: z.string().optional() }), tableName: "settings", primaryKey: "key" }),
};

export function createEntity<T extends BaseEntity>(data: Omit<T, "id" | "createdAt" | "updatedAt">): T {
  return {
    ...data,
    id: generateUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as T;
}

// Unused
export type ModelHook<T> = (model: T, action: "create" | "update" | "delete") => void | Promise<void>;
export const MODEL_VERSION = 3;
export type AuditableModel = AuditableEntity & { __model: string };
