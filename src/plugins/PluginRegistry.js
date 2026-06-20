import { loadAdditionalPlugins } from "./ecosystems/PluginLoader.js";
import path from 'path';
import fs from 'fs/promises';
import { pathToFileURL } from 'url';

/**
 * ============================================================================
 * Plugin Registry for entkapp v5.0.0
 * ============================================================================
 * Advanced Plugin Registry supporting Builtin and Custom plugins.
 * v5.0.0: Added runAllDependencyDiagnostics() for project-wide dependency checks.
 */
export class PluginRegistry {
    constructor(context) {
        this.context = context;
        this.plugins = new Map();
        this.config = null;
    }

    async init(projectRoot) {
        const configPath = path.join(projectRoot, 'entkapp', 'config.json');
        try {
            const configRaw = await fs.readFile(configPath, 'utf8');
            this.config = JSON.parse(configRaw);
        } catch (e) {
            this.config = {
                useBuiltinPlugins: true,
                useCustomPlugins: true,
            };
        }
        if (this.config.useBuiltinPlugins !== false) {
            await this.loadBuiltinPlugins();
        }
        if (this.config.useCustomPlugins !== false) {
            await this.loadCustomPlugins(projectRoot);
        }
    }

    async loadBuiltinPlugins() {
        // Delegate to PluginLoader which registers all built-in plugins
        loadAdditionalPlugins(this);

        // Also load TypeScript and Next.js plugins (primary framework plugins)
        const { ReactPlugin, VuePlugin, SveltePlugin, AngularPlugin, PreactPlugin, SolidPlugin, QwikPlugin, LitPlugin, NuxtPlugin, RemixPlugin, SvelteKitPlugin, AstroPlugin, VitepressPlugin, GatsbyPlugin, RedwoodPlugin, NextJsPlugin, TypeScriptPlugin, ExpressPlugin, FastifyPlugin, NestJsPlugin, HonoPlugin, KoaPlugin, ElysiaPlugin, GraphQLPlugin, ApolloPlugin, TRPCPlugin, DatabasePlugin, PrismaPlugin, DrizzlePlugin, MongoosePlugin, SupabasePlugin, FirebasePlugin, ClerkPlugin, ReduxPlugin, ZustandPlugin, JotaiPlugin, RecoilPlugin, MobXPlugin, PiniaPlugin, TanStackQueryPlugin, ReactRouterPlugin, TanStackRouterPlugin, VueRouterPlugin, AntdPlugin, MuiPlugin, ShadcnPlugin, RadixUIPlugin, ChakraUIPlugin, FramerMotionPlugin, GSAPPlugin, ZodPlugin, YupPlugin, ValibotPlugin, I18nextPlugin, VueI18nPlugin, SentryPlugin, OpenTelemetryPlugin, SocketIoPlugin, TailwindPlugin, PostcssPlugin, UnoCSSPlugin, StylelintPlugin, EslintPlugin, PrettierPlugin, BiomePlugin, OxlintPlugin, HuskyPlugin, LintStagedPlugin, CommitlintPlugin, ChangesetPlugin, BabelPlugin, SWCPlugin, VitePlugin, EsbuildPlugin, RollupPlugin, WebpackPlugin, ParcelPlugin, TurboPlugin, NxPlugin, JestPlugin, VitestPlugin, PlaywrightPlugin, CypressPlugin, StorybookPlugin, MswPlugin, GithubActionsPlugin, DockerPlugin, TerraformPlugin, EditorConfigPlugin, NvmPlugin, VoltaPlugin, DotenvPlugin, PnpmPlugin, YarnPlugin, BunPlugin, SwiperPlugin, QuillPlugin, EnvelopPlugin } = await import('./ecosystems/UltimateBundle.js');
        this.register(new ReactPlugin(this.context));
        this.register(new VuePlugin(this.context));
        this.register(new SveltePlugin(this.context));
        this.register(new AngularPlugin(this.context));
        this.register(new PreactPlugin(this.context));
        this.register(new SolidPlugin(this.context));
        this.register(new QwikPlugin(this.context));
        this.register(new LitPlugin(this.context));
        this.register(new NuxtPlugin(this.context));
        this.register(new RemixPlugin(this.context));
        this.register(new SvelteKitPlugin(this.context));
        this.register(new AstroPlugin(this.context));
        this.register(new VitepressPlugin(this.context));
        this.register(new GatsbyPlugin(this.context));
        this.register(new RedwoodPlugin(this.context));
        this.register(new NextJsPlugin(this.context));
        this.register(new TypeScriptPlugin(this.context));
        this.register(new ExpressPlugin(this.context));
        this.register(new FastifyPlugin(this.context));
        this.register(new NestJsPlugin(this.context));
        this.register(new HonoPlugin(this.context));
        this.register(new KoaPlugin(this.context));
        this.register(new ElysiaPlugin(this.context));
        this.register(new GraphQLPlugin(this.context));
        this.register(new ApolloPlugin(this.context));
        this.register(new TRPCPlugin(this.context));
        this.register(new DatabasePlugin(this.context));
        this.register(new PrismaPlugin(this.context));
        this.register(new DrizzlePlugin(this.context));
        this.register(new MongoosePlugin(this.context));
        this.register(new SupabasePlugin(this.context));
        this.register(new FirebasePlugin(this.context));
        this.register(new ClerkPlugin(this.context));
        this.register(new ReduxPlugin(this.context));
        this.register(new ZustandPlugin(this.context));
        this.register(new JotaiPlugin(this.context));
        this.register(new RecoilPlugin(this.context));
        this.register(new MobXPlugin(this.context));
        this.register(new PiniaPlugin(this.context));
        this.register(new TanStackQueryPlugin(this.context));
        this.register(new ReactRouterPlugin(this.context));
        this.register(new TanStackRouterPlugin(this.context));
        this.register(new VueRouterPlugin(this.context));
        this.register(new AntdPlugin(this.context));
        this.register(new MuiPlugin(this.context));
        this.register(new ShadcnPlugin(this.context));
        this.register(new RadixUIPlugin(this.context));
        this.register(new ChakraUIPlugin(this.context));
        this.register(new FramerMotionPlugin(this.context));
        this.register(new GSAPPlugin(this.context));
        this.register(new ZodPlugin(this.context));
        this.register(new YupPlugin(this.context));
        this.register(new ValibotPlugin(this.context));
        this.register(new I18nextPlugin(this.context));
        this.register(new VueI18nPlugin(this.context));
        this.register(new SentryPlugin(this.context));
        this.register(new OpenTelemetryPlugin(this.context));
        this.register(new SocketIoPlugin(this.context));
        this.register(new TailwindPlugin(this.context));
        this.register(new PostcssPlugin(this.context));
        this.register(new UnoCSSPlugin(this.context));
        this.register(new StylelintPlugin(this.context));
        this.register(new EslintPlugin(this.context));
        this.register(new PrettierPlugin(this.context));
        this.register(new BiomePlugin(this.context));
        this.register(new OxlintPlugin(this.context));
        this.register(new HuskyPlugin(this.context));
        this.register(new LintStagedPlugin(this.context));
        this.register(new CommitlintPlugin(this.context));
        this.register(new ChangesetPlugin(this.context));
        this.register(new BabelPlugin(this.context));
        this.register(new SWCPlugin(this.context));
        this.register(new VitePlugin(this.context));
        this.register(new EsbuildPlugin(this.context));
        this.register(new RollupPlugin(this.context));
        this.register(new WebpackPlugin(this.context));
        this.register(new ParcelPlugin(this.context));
        this.register(new TurboPlugin(this.context));
        this.register(new NxPlugin(this.context));
        this.register(new JestPlugin(this.context));
        this.register(new VitestPlugin(this.context));
        this.register(new PlaywrightPlugin(this.context));
        this.register(new CypressPlugin(this.context));
        this.register(new StorybookPlugin(this.context));
        this.register(new MswPlugin(this.context));
        this.register(new GithubActionsPlugin(this.context));
        this.register(new DockerPlugin(this.context));
        this.register(new TerraformPlugin(this.context));
        this.register(new EditorConfigPlugin(this.context));
        this.register(new NvmPlugin(this.context));
        this.register(new VoltaPlugin(this.context));
        this.register(new DotenvPlugin(this.context));
        this.register(new PnpmPlugin(this.context));
        this.register(new YarnPlugin(this.context));
        this.register(new BunPlugin(this.context));
        this.register(new SwiperPlugin(this.context));
        this.register(new QuillPlugin(this.context));
        this.register(new EnvelopPlugin(this.context));
    }

    async loadCustomPlugins(projectRoot) {
        const pluginsDir = path.join(projectRoot, 'entkapp', 'plugins');
        try {
            const entries = await fs.readdir(pluginsDir, { withFileTypes: true });
            for (const entry of entries) {
                let pluginPath = path.join(pluginsDir, entry.name);
                // Folder-based plugin support
                if (entry.isDirectory()) {
                    const files = await fs.readdir(pluginPath);
                    if (files.includes('index.ts')) {
                        pluginPath = path.join(pluginPath, 'index.ts');
                    } else if (files.includes('index.js')) {
                        pluginPath = path.join(pluginPath, 'index.js');
                    } else {
                        continue;
                    }
                }
                if (pluginPath.endsWith('.ts')) {
                    await this.loadTypeScriptPlugin(pluginPath);
                } else if (pluginPath.endsWith('.js') || pluginPath.endsWith('.mjs')) {
                    await this.loadJavaScriptPlugin(pluginPath);
                }
            }
        } catch (e) {
            // No custom plugins or dir missing
        }
    }

    async loadJavaScriptPlugin(pluginPath) {
        try {
            const pluginModule = await import(pathToFileURL(pluginPath).href);
            const PluginClass = pluginModule.default || pluginModule;
            const pluginInstance = new PluginClass(this.context);
            this.register(pluginInstance);
        } catch (e) {
            console.error(`[PluginRegistry] Failed to load JS plugin ${pluginPath}:`, e);
        }
    }

    async loadTypeScriptPlugin(pluginPath) {
        try {
            if (this.context?.verbose) {
                console.log(`[PluginRegistry] Transpiling TS plugin: ${pluginPath}`);
            }
            await this.loadJavaScriptPlugin(pluginPath);
        } catch (e) {
            console.error(`[PluginRegistry] Failed to load TS plugin ${pluginPath}:`, e);
        }
    }

    register(plugin) {
        if (plugin && plugin.name) {
            this.plugins.set(plugin.name, plugin);
        }
    }

    getPlugins() {
        return Array.from(this.plugins.values());
    }

    getPlugin(name) {
        return this.plugins.get(name);
    }

    async getActivePlugins(baseDir) {
        const active = [];
        for (const plugin of this.plugins.values()) {
            if (await plugin.isActive(baseDir)) {
                active.push(plugin);
            }
        }
        return active;
    }

    /**
     * Version 5.0.0: Run dependency diagnostics across all registered plugins.
     * Returns a consolidated list of missing/misplaced dependencies and orphaned configs.
     *
     * @param {string} baseDir - The project root directory to check
     * @returns {Promise<Array<{
     *   plugin: string,
     *   severity: 'error' | 'warning',
     *   message: string,
     *   package?: string,
     *   configFile?: string,
     *   expectedIn?: string,
     *   foundIn?: string | null
     * }>>}
     */
    async runAllDependencyDiagnostics(baseDir) {
        const allDiagnostics = [];
        const seenMessages = new Set();

        for (const plugin of this.plugins.values()) {
            if (typeof plugin.runDependencyDiagnostics === 'function') {
                try {
                    const diagnostics = await plugin.runDependencyDiagnostics(baseDir);
                    for (const d of diagnostics) {
                        // Deduplicate by message to avoid noise from overlapping plugins
                        if (!seenMessages.has(d.message)) {
                            seenMessages.add(d.message);
                            allDiagnostics.push(d);
                        }
                    }
                } catch (e) {
                    if (this.context?.verbose) {
                        console.warn(`[PluginRegistry] Dependency diagnostic failed for plugin "${plugin.name}":`, e.message);
                    }
                }
            }
        }

        // Sort: errors first, then warnings; then alphabetically by plugin name
        return allDiagnostics.sort((a, b) => {
            if (a.severity !== b.severity) return a.severity === 'error' ? -1 : 1;
            return a.plugin.localeCompare(b.plugin);
        });
    }

    /**
     * Version 5.0.0: Format dependency diagnostics for console output.
     * @param {Array} diagnostics - Result of runAllDependencyDiagnostics()
     * @returns {string} Formatted string ready for console output
     */
    formatDependencyDiagnostics(diagnostics) {
        if (diagnostics.length === 0) {
            return '[entkapp] No missing dependencies detected.';
        }

        const errors = diagnostics.filter(d => d.severity === 'error');
        const warnings = diagnostics.filter(d => d.severity === 'warning');

        const lines = [];
        lines.push(`[entkapp] Dependency Diagnostics: ${errors.length} error(s), ${warnings.length} warning(s)`);
        lines.push('');

        if (errors.length > 0) {
            lines.push('  Errors:');
            for (const d of errors) {
                lines.push(`    [ERROR]  ${d.message}`);
            }
            lines.push('');
        }

        if (warnings.length > 0) {
            lines.push('  Warnings:');
            for (const d of warnings) {
                lines.push(`    [WARN]   ${d.message}`);
            }
        }

        return lines.join('\n');
    }
}
