import { createHash, randomBytes } from "crypto";

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function md5(input: string): string {
  return createHash("md5").update(input).digest("hex");
}

export function generateId(length = 16): string {
  return randomBytes(length).toString("hex");
}

export function generateUUID(): string {
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

// Unused
export function hmac(key: string, data: string): string {
  const { createHmac } = require("crypto");
  return createHmac("sha256", key).update(data).digest("hex");
}

export const HASH_ALGORITHMS = ["sha256", "sha512", "md5"] as const;
export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number];
