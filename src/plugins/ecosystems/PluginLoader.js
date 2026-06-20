/**
 * ============================================================================
 * Plugin Loader for entkapp v5.0.0
 * ============================================================================
 * Registers all built-in plugins from all ecosystem bundles.
 * v5.0.0: Added 40+ new plugins with full dependency detection support.
 */
import {
  TailwindPlugin, PostcssPlugin, UnoCSSPlugin, StylelintPlugin,
  JestPlugin, VitestPlugin, PlaywrightPlugin, CypressPlugin, StorybookPlugin, MswPlugin,
  EslintPlugin, PrettierPlugin, BiomePlugin, OxlintPlugin,
  HuskyPlugin, LintStagedPlugin, CommitlintPlugin, ChangesetPlugin,
  BabelPlugin, SWCPlugin,
  VitePlugin, EsbuildPlugin, RollupPlugin, WebpackPlugin, ParcelPlugin,
  TurboPlugin, NxPlugin,
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

import {
  GraphQLPlugin, ApolloPlugin, DatabasePlugin, PrismaPlugin, DrizzlePlugin, MongoosePlugin,
  SupabasePlugin, FirebasePlugin, ClerkPlugin, TRPCPlugin,
} from './BackendServices.js';

import {
  NuxtPlugin, RemixPlugin, SvelteKitPlugin, AstroPlugin, VitepressPlugin, GatsbyPlugin, RedwoodPlugin,
} from './GenericPlugins.js';

import {
  ReactPlugin, VuePlugin, SveltePlugin, AngularPlugin, PreactPlugin, SolidPlugin, QwikPlugin, LitPlugin,
} from './ModernFrameworks.js';

export function loadAdditionalPlugins(registry) {
  const ctx = registry.context;

  // ── Frontend Frameworks ──────────────────────────────────────────────────
  registry.register(new ReactPlugin(ctx));
  registry.register(new VuePlugin(ctx));
  registry.register(new SveltePlugin(ctx));
  registry.register(new AngularPlugin(ctx));
  registry.register(new PreactPlugin(ctx));
  registry.register(new SolidPlugin(ctx));
  registry.register(new QwikPlugin(ctx));
  registry.register(new LitPlugin(ctx));

  // ── Meta-Frameworks ──────────────────────────────────────────────────────
  registry.register(new NuxtPlugin(ctx));
  registry.register(new RemixPlugin(ctx));
  registry.register(new SvelteKitPlugin(ctx));
  registry.register(new AstroPlugin(ctx));
  registry.register(new VitepressPlugin(ctx));
  registry.register(new GatsbyPlugin(ctx));
  registry.register(new RedwoodPlugin(ctx));

  // ── Backend Frameworks ───────────────────────────────────────────────────
  registry.register(new ExpressPlugin(ctx));
  registry.register(new FastifyPlugin(ctx));
  registry.register(new NestJsPlugin(ctx));
  registry.register(new HonoPlugin(ctx));
  registry.register(new KoaPlugin(ctx));
  registry.register(new ElysiaPlugin(ctx));

  // ── Data / API ───────────────────────────────────────────────────────────
  registry.register(new GraphQLPlugin(ctx));
  registry.register(new ApolloPlugin(ctx));
  registry.register(new TRPCPlugin(ctx));
  registry.register(new DatabasePlugin(ctx));
  registry.register(new PrismaPlugin(ctx));
  registry.register(new DrizzlePlugin(ctx));
  registry.register(new MongoosePlugin(ctx));

  // ── BaaS / Auth ──────────────────────────────────────────────────────────
  registry.register(new SupabasePlugin(ctx));
  registry.register(new FirebasePlugin(ctx));
  registry.register(new ClerkPlugin(ctx));

  // ── State Management ─────────────────────────────────────────────────────
  registry.register(new ReduxPlugin(ctx));
  registry.register(new ZustandPlugin(ctx));
  registry.register(new JotaiPlugin(ctx));
  registry.register(new RecoilPlugin(ctx));
  registry.register(new MobXPlugin(ctx));
  registry.register(new PiniaPlugin(ctx));
  registry.register(new TanStackQueryPlugin(ctx));

  // ── Routing ──────────────────────────────────────────────────────────────
  registry.register(new ReactRouterPlugin(ctx));
  registry.register(new TanStackRouterPlugin(ctx));
  registry.register(new VueRouterPlugin(ctx));

  // ── UI Components ────────────────────────────────────────────────────────
  registry.register(new AntdPlugin(ctx));
  registry.register(new MuiPlugin(ctx));
  registry.register(new ShadcnPlugin(ctx));
  registry.register(new RadixUIPlugin(ctx));
  registry.register(new ChakraUIPlugin(ctx));

  // ── Animation ────────────────────────────────────────────────────────────
  registry.register(new FramerMotionPlugin(ctx));
  registry.register(new GSAPPlugin(ctx));

  // ── Validation ───────────────────────────────────────────────────────────
  registry.register(new ZodPlugin(ctx));
  registry.register(new YupPlugin(ctx));
  registry.register(new ValibotPlugin(ctx));

  // ── Internationalisation ─────────────────────────────────────────────────
  registry.register(new I18nextPlugin(ctx));
  registry.register(new VueI18nPlugin(ctx));

  // ── Monitoring ───────────────────────────────────────────────────────────
  registry.register(new SentryPlugin(ctx));
  registry.register(new OpenTelemetryPlugin(ctx));

  // ── Real-time ────────────────────────────────────────────────────────────
  registry.register(new SocketIoPlugin(ctx));

  // ── CSS / Styling ────────────────────────────────────────────────────────
  registry.register(new TailwindPlugin(ctx));
  registry.register(new PostcssPlugin(ctx));
  registry.register(new UnoCSSPlugin(ctx));
  registry.register(new StylelintPlugin(ctx));

  // ── Linting / Formatting ─────────────────────────────────────────────────
  registry.register(new EslintPlugin(ctx));
  registry.register(new PrettierPlugin(ctx));
  registry.register(new BiomePlugin(ctx));
  registry.register(new OxlintPlugin(ctx));

  // ── Git Hooks / Commit ───────────────────────────────────────────────────
  registry.register(new HuskyPlugin(ctx));
  registry.register(new LintStagedPlugin(ctx));
  registry.register(new CommitlintPlugin(ctx));
  registry.register(new ChangesetPlugin(ctx));

  // ── Transpilers ──────────────────────────────────────────────────────────
  registry.register(new BabelPlugin(ctx));
  registry.register(new SWCPlugin(ctx));

  // ── Build Tools ──────────────────────────────────────────────────────────
  registry.register(new VitePlugin(ctx));
  registry.register(new EsbuildPlugin(ctx));
  registry.register(new RollupPlugin(ctx));
  registry.register(new WebpackPlugin(ctx));
  registry.register(new ParcelPlugin(ctx));

  // ── Monorepo ─────────────────────────────────────────────────────────────
  registry.register(new TurboPlugin(ctx));
  registry.register(new NxPlugin(ctx));

  // ── Testing ──────────────────────────────────────────────────────────────
  registry.register(new JestPlugin(ctx));
  registry.register(new VitestPlugin(ctx));
  registry.register(new PlaywrightPlugin(ctx));
  registry.register(new CypressPlugin(ctx));
  registry.register(new StorybookPlugin(ctx));
  registry.register(new MswPlugin(ctx));

  // ── CI / Infra ───────────────────────────────────────────────────────────
  registry.register(new GithubActionsPlugin(ctx));
  registry.register(new DockerPlugin(ctx));
  registry.register(new TerraformPlugin(ctx));

  // ── Dev Environment ──────────────────────────────────────────────────────
  registry.register(new EditorConfigPlugin(ctx));
  registry.register(new NvmPlugin(ctx));
  registry.register(new VoltaPlugin(ctx));
  registry.register(new DotenvPlugin(ctx));

  // ── Package Managers ─────────────────────────────────────────────────────
  registry.register(new PnpmPlugin(ctx));
  registry.register(new YarnPlugin(ctx));
  registry.register(new BunPlugin(ctx));

  // ── Misc Utilities ───────────────────────────────────────────────────────
  registry.register(new SwiperPlugin(ctx));
  registry.register(new QuillPlugin(ctx));
  registry.register(new EnvelopPlugin(ctx));
}
