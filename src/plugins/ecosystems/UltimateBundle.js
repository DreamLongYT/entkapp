/**
 * ============================================================================
 * entkapp Ultimate Ecosystem Bundle v5.0.0
 * ============================================================================
 * Re-exports all plugins from the modular ecosystem files.
 * v5.0.0: All plugins now implement getRequiredPackages() for dependency detection.
 *
 * For the full plugin list, see:
 *   - ModernFrameworks.js   (React, Vue, Svelte, Angular, Preact, Solid, Qwik, Lit)
 *   - GenericPlugins.js     (Nuxt, Remix, SvelteKit, Astro, VitePress, Gatsby, Redwood)
 *   - BackendServices.js    (GraphQL, Apollo, Prisma, Drizzle, Mongoose, Supabase, Firebase, Clerk, tRPC)
 *   - MorePlugins.js        (Build tools, CSS, Linting, Testing, CI, Dev environment)
 *   - NewPlugins.js         (State, Routing, UI, Animation, Validation, i18n, Monitoring, Backend)
 *   - NextJsPlugin.js       (Next.js)
 *   - TypeScriptPlugin.js   (TypeScript)
 */

// ── Frontend Frameworks ────────────────────────────────────────────────────
export {
  ReactPlugin, VuePlugin, SveltePlugin, AngularPlugin,
  PreactPlugin, SolidPlugin, QwikPlugin, LitPlugin,
} from './ModernFrameworks.js';

// ── Meta-Frameworks ────────────────────────────────────────────────────────
export {
  NuxtPlugin, RemixPlugin, SvelteKitPlugin, AstroPlugin,
  VitepressPlugin, GatsbyPlugin, RedwoodPlugin,
} from './GenericPlugins.js';

// ── Next.js ────────────────────────────────────────────────────────────────
export { NextJsPlugin } from './NextJsPlugin.js';

// ── TypeScript ─────────────────────────────────────────────────────────────
export { TypeScriptPlugin } from './TypeScriptPlugin.js';

// ── Backend Services & Data ────────────────────────────────────────────────
export {
  GraphQLPlugin, ApolloPlugin, DatabasePlugin,
  PrismaPlugin, DrizzlePlugin, MongoosePlugin,
  SupabasePlugin, FirebasePlugin, ClerkPlugin, TRPCPlugin,
} from './BackendServices.js';

// ── Build Tools, Testing, Linting, CI ─────────────────────────────────────
export {
  VitePlugin, EsbuildPlugin, RollupPlugin, WebpackPlugin, ParcelPlugin,
  TurboPlugin, NxPlugin,
  TailwindPlugin, PostcssPlugin, UnoCSSPlugin, StylelintPlugin,
  EslintPlugin, PrettierPlugin, BiomePlugin, OxlintPlugin,
  HuskyPlugin, LintStagedPlugin, CommitlintPlugin, ChangesetPlugin,
  BabelPlugin, SWCPlugin,
  JestPlugin, VitestPlugin, PlaywrightPlugin, CypressPlugin, StorybookPlugin, MswPlugin,
  GithubActionsPlugin, DockerPlugin, TerraformPlugin,
  EditorConfigPlugin, NvmPlugin, VoltaPlugin, DotenvPlugin,
  PnpmPlugin, YarnPlugin, BunPlugin,
  SwiperPlugin, QuillPlugin, EnvelopPlugin,
} from './MorePlugins.js';

// ── State, Routing, UI, Animation, Validation, i18n, Monitoring, Backend ──
export {
  ReduxPlugin, ZustandPlugin, JotaiPlugin, RecoilPlugin, MobXPlugin, PiniaPlugin, TanStackQueryPlugin,
  ReactRouterPlugin, TanStackRouterPlugin, VueRouterPlugin,
  AntdPlugin, MuiPlugin, ShadcnPlugin, RadixUIPlugin, ChakraUIPlugin,
  FramerMotionPlugin, GSAPPlugin,
  ZodPlugin, YupPlugin, ValibotPlugin,
  I18nextPlugin, VueI18nPlugin,
  SentryPlugin, OpenTelemetryPlugin,
  ExpressPlugin, FastifyPlugin, NestJsPlugin, HonoPlugin, KoaPlugin, ElysiaPlugin,
  SocketIoPlugin,
} from './NewPlugins.js';

/**
 * UltimateBundle array — convenience list for programmatic registration.
 * Import and iterate to register all built-in plugins at once.
 */
import {
  ReactPlugin, VuePlugin, SveltePlugin, AngularPlugin,
  PreactPlugin, SolidPlugin, QwikPlugin, LitPlugin,
} from './ModernFrameworks.js';
import {
  NuxtPlugin, RemixPlugin, SvelteKitPlugin, AstroPlugin,
  VitepressPlugin, GatsbyPlugin, RedwoodPlugin,
} from './GenericPlugins.js';
import { NextJsPlugin } from './NextJsPlugin.js';
import { TypeScriptPlugin } from './TypeScriptPlugin.js';
import {
  GraphQLPlugin, ApolloPlugin, DatabasePlugin,
  PrismaPlugin, DrizzlePlugin, MongoosePlugin,
  SupabasePlugin, FirebasePlugin, ClerkPlugin, TRPCPlugin,
} from './BackendServices.js';
import {
  VitePlugin, EsbuildPlugin, RollupPlugin, WebpackPlugin, ParcelPlugin,
  TurboPlugin, NxPlugin,
  TailwindPlugin, PostcssPlugin, UnoCSSPlugin, StylelintPlugin,
  EslintPlugin, PrettierPlugin, BiomePlugin, OxlintPlugin,
  HuskyPlugin, LintStagedPlugin, CommitlintPlugin, ChangesetPlugin,
  BabelPlugin, SWCPlugin,
  JestPlugin, VitestPlugin, PlaywrightPlugin, CypressPlugin, StorybookPlugin, MswPlugin,
  GithubActionsPlugin, DockerPlugin, TerraformPlugin,
  EditorConfigPlugin, NvmPlugin, VoltaPlugin, DotenvPlugin,
  PnpmPlugin, YarnPlugin, BunPlugin,
  SwiperPlugin, QuillPlugin, EnvelopPlugin,
} from './MorePlugins.js';
import {
  ReduxPlugin, ZustandPlugin, JotaiPlugin, RecoilPlugin, MobXPlugin, PiniaPlugin, TanStackQueryPlugin,
  ReactRouterPlugin, TanStackRouterPlugin, VueRouterPlugin,
  AntdPlugin, MuiPlugin, ShadcnPlugin, RadixUIPlugin, ChakraUIPlugin,
  FramerMotionPlugin, GSAPPlugin,
  ZodPlugin, YupPlugin, ValibotPlugin,
  I18nextPlugin, VueI18nPlugin,
  SentryPlugin, OpenTelemetryPlugin,
  ExpressPlugin, FastifyPlugin, NestJsPlugin, HonoPlugin, KoaPlugin, ElysiaPlugin,
  SocketIoPlugin,
} from './NewPlugins.js';

export const UltimateBundle = [
  // Frontend
  ReactPlugin, VuePlugin, SveltePlugin, AngularPlugin,
  PreactPlugin, SolidPlugin, QwikPlugin, LitPlugin,
  // Meta-Frameworks
  NuxtPlugin, RemixPlugin, SvelteKitPlugin, AstroPlugin,
  VitepressPlugin, GatsbyPlugin, RedwoodPlugin,
  NextJsPlugin, TypeScriptPlugin,
  // Backend
  ExpressPlugin, FastifyPlugin, NestJsPlugin, HonoPlugin, KoaPlugin, ElysiaPlugin,
  // Data / API
  GraphQLPlugin, ApolloPlugin, TRPCPlugin, DatabasePlugin,
  PrismaPlugin, DrizzlePlugin, MongoosePlugin,
  // BaaS / Auth
  SupabasePlugin, FirebasePlugin, ClerkPlugin,
  // State
  ReduxPlugin, ZustandPlugin, JotaiPlugin, RecoilPlugin, MobXPlugin, PiniaPlugin, TanStackQueryPlugin,
  // Routing
  ReactRouterPlugin, TanStackRouterPlugin, VueRouterPlugin,
  // UI
  AntdPlugin, MuiPlugin, ShadcnPlugin, RadixUIPlugin, ChakraUIPlugin,
  // Animation
  FramerMotionPlugin, GSAPPlugin,
  // Validation
  ZodPlugin, YupPlugin, ValibotPlugin,
  // i18n
  I18nextPlugin, VueI18nPlugin,
  // Monitoring
  SentryPlugin, OpenTelemetryPlugin,
  // Real-time
  SocketIoPlugin,
  // CSS
  TailwindPlugin, PostcssPlugin, UnoCSSPlugin, StylelintPlugin,
  // Linting
  EslintPlugin, PrettierPlugin, BiomePlugin, OxlintPlugin,
  // Git Hooks
  HuskyPlugin, LintStagedPlugin, CommitlintPlugin, ChangesetPlugin,
  // Transpilers
  BabelPlugin, SWCPlugin,
  // Build Tools
  VitePlugin, EsbuildPlugin, RollupPlugin, WebpackPlugin, ParcelPlugin,
  // Monorepo
  TurboPlugin, NxPlugin,
  // Testing
  JestPlugin, VitestPlugin, PlaywrightPlugin, CypressPlugin, StorybookPlugin, MswPlugin,
  // CI / Infra
  GithubActionsPlugin, DockerPlugin, TerraformPlugin,
  // Dev Environment
  EditorConfigPlugin, NvmPlugin, VoltaPlugin, DotenvPlugin,
  // Package Managers
  PnpmPlugin, YarnPlugin, BunPlugin,
  // Misc
  SwiperPlugin, QuillPlugin, EnvelopPlugin,
];
