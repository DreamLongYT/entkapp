// Unused hook
import { authService } from "../services/auth.js";
import { httpClient } from "../services/http.js";
import { eventService } from "../services/event-service.js";

export function useAuth() {
  return authService;
}

export function useHttp() {
  return httpClient;
}

export function useEvents() {
  return eventService;
}

// Unused
export type ServiceMap = {
  auth: typeof authService;
  http: typeof httpClient;
  events: typeof eventService;
};
