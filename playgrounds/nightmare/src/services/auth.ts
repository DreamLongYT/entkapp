import type { UserId, SessionId } from "../types/index.js";
import { generateId, sha256 } from "../utils/index.js";
import { logger } from "../utils/logger.js";
// CIRCULAR: auth -> storage -> auth (via user persistence)
import type { StorageService } from "./storage.js";

export interface AuthToken {
  token: string;
  userId: UserId;
  sessionId: SessionId;
  expiresAt: Date;
}

export interface AuthCredentials {
  username: string;
  password: string;
}

export class AuthService {
  private sessions = new Map<string, AuthToken>();
  private storage?: StorageService;

  constructor(storage?: StorageService) {
    this.storage = storage;
  }

  async login(credentials: AuthCredentials): Promise<AuthToken> {
    const hash = sha256(credentials.password);
    logger.info("Login attempt", { username: credentials.username });
    const token: AuthToken = {
      token: generateId(32),
      userId: credentials.username as UserId,
      sessionId: generateId(16) as SessionId,
      expiresAt: new Date(Date.now() + 3600_000),
    };
    this.sessions.set(token.token, token);
    if (this.storage) {
      await this.storage.set(`session:${token.sessionId}`, JSON.stringify(token));
    }
    return token;
  }

  async logout(token: string): Promise<void> {
    const session = this.sessions.get(token);
    if (session && this.storage) {
      await this.storage.delete(`session:${session.sessionId}`);
    }
    this.sessions.delete(token);
  }

  verify(token: string): AuthToken | null {
    const session = this.sessions.get(token);
    if (!session) return null;
    if (session.expiresAt < new Date()) {
      this.sessions.delete(token);
      return null;
    }
    return session;
  }

  // Unused
  refreshToken(token: string): Promise<AuthToken> {
    throw new Error("Not implemented");
  }
}

export const authService = new AuthService();
// Unused
export type AuthMiddleware = (token: string) => Promise<boolean>;
export const AUTH_HEADER = "Authorization" as const;
