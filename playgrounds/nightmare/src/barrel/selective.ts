// Selective barrel – only re-exports specific things
// Creates confusion because some names appear multiple times across barrels

export { AuthService, authService, type AuthToken, AUTH_HEADER } from "../services/auth.js";
export { InMemoryStorage, storageService, DEFAULT_TTL } from "../services/storage.js";
export { LRUCache, cacheService, CACHE_MISS } from "../services/cache.js";
export { HttpClient, httpClient, HTTP_METHODS } from "../services/http.js";
export { EventService, eventService, EVENT_NAMESPACE } from "../services/event-service.js";

// Re-export with different names (creates duplicate symbol confusion)
export { AuthService as AuthenticationService } from "../services/auth.js";
export { InMemoryStorage as MemoryStore } from "../services/storage.js";
export { LRUCache as Cache } from "../services/cache.js";

// Unused
export const SELECTIVE_BARREL_MARKER = Symbol("selective");
