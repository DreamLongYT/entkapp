export type ErrorCode =
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR"
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "CONFLICT";

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export type AsyncResult<T, E = AppError> = Promise<Result<T, E>>;

// Never used
export type PanicError = { fatal: true; reason: string };
