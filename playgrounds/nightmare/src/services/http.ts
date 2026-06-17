import type { Result } from "../types/errors.js";
import { retry, timeout } from "../utils/async.js";
import { logger } from "../utils/logger.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";

export interface HttpRequest {
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  retries?: number;
}

export interface HttpResponse<T = unknown> {
  status: number;
  headers: Record<string, string>;
  body: T;
}

export class HttpClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl = "", headers: Record<string, string> = {}) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = headers;
  }

  async request<T>(req: HttpRequest): Promise<Result<HttpResponse<T>>> {
    const url = `${this.baseUrl}${req.url}`;
    const headers = { ...this.defaultHeaders, ...req.headers, "Content-Type": "application/json" };

    const doFetch = async (): Promise<HttpResponse<T>> => {
      const res = await fetch(url, {
        method: req.method,
        headers,
        body: req.body ? JSON.stringify(req.body) : undefined,
      });
      const body = await res.json() as T;
      return { status: res.status, headers: Object.fromEntries(res.headers.entries()), body };
    };

    try {
      const result = await timeout(
        retry(doFetch, req.retries ?? 3),
        req.timeoutMs ?? 30_000
      );
      logger.debug("HTTP request success", { url, status: result.status });
      return { ok: true, value: result };
    } catch (e) {
      logger.error("HTTP request failed", { url, error: String(e) });
      return { ok: false, error: { code: "INTERNAL_ERROR", message: String(e) } };
    }
  }

  get<T>(url: string, headers?: Record<string, string>): Promise<Result<HttpResponse<T>>> {
    return this.request({ url, method: "GET", headers });
  }

  post<T>(url: string, body: unknown, headers?: Record<string, string>): Promise<Result<HttpResponse<T>>> {
    return this.request({ url, method: "POST", body, headers });
  }

  // Unused
  patch<T>(url: string, body: unknown): Promise<Result<HttpResponse<T>>> {
    return this.request({ url, method: "PATCH", body });
  }

  delete<T>(url: string): Promise<Result<HttpResponse<T>>> {
    return this.request({ url, method: "DELETE" });
  }
}

export const httpClient = new HttpClient();
// Unused
export type Interceptor = (req: HttpRequest) => HttpRequest;
export const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"];
