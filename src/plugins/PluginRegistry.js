import path from 'path';
import fs from 'fs/promises';
import { pathToFileURL } from 'url';

/**
 * Advanced Plugin Registry supporting Builtin, Custom, and Knip-style plugins.
 * Version 3.2.0: Enhanced with support for dynamic custom getters.
 */
export class PluginRegistry {
    constructor(context) {
        this.context = context;
        this.plugins = new Map();
        this.config = null;
    }

    async init(projectRoot) {
        const configPath = path.join(projectRoot, 'pkg-scaffold', 'config.json');
        try {
            const configRaw = await fs.readFile(configPath, 'utf8');
            this.config = JSON.parse(configRaw);
        } catch (e) {
            this.config = {
                useBuiltinPlugins: true,
                useCustomPlugins: true,
                supportKnipPlugins: true
            };
        }

        if (this.config.useBuiltinPlugins) {
            await this.loadBuiltinPlugins();
        }

        if (this.config.useCustomPlugins) {
            await this.loadCustomPlugins(projectRoot);
        }

        if (this.config.supportKnipPlugins) {
            await this.initKnipAdapter();
        }
    }

    async loadBuiltinPlugins() {
        const { NextJsPlugin } = await import('./ecosystems/NextJsPlugin.js');
        const { NuxtPlugin, RemixPlugin, SvelteKitPlugin, AstroPlugin } = await import('./ecosystems/GenericPlugins.js');
        const { TypeScriptPlugin } = await import('./ecosystems/TypeScriptPlugin.js');

        const builtins = [
            new NextJsPlugin(this.context),
            new NuxtPlugin(this.context),
            new RemixPlugin(this.context),
            new SvelteKitPlugin(this.context),
            new AstroPlugin(this.context),
            new TypeScriptPlugin(this.context)
        ];

        builtins.forEach(p => {
            if (!this.config.enabledPlugins || this.config.enabledPlugins.includes(p.name)) {
                this.register(p);
            }
        });
    }

    async loadCustomPlugins(projectRoot) {
        const pluginsDir = path.join(projectRoot, 'pkg-scaffold', 'plugins');
        try {
            const files = await fs.readdir(pluginsDir);
            for (const file of files) {
                if (file.endsWith('.js') || file.endsWith('.mjs')) {
                    const pluginModule = await import(pathToFileURL(path.join(pluginsDir, file)).href);
                    const PluginClass = pluginModule.default || pluginModule;
                    const pluginInstance = new PluginClass(this.context);

                    const version = pluginInstance.get('version');
                    if (version && this.context.verbose) {
                        console.log(`[PluginRegistry] Loaded ${pluginInstance.name} v${version}`);
                    }
                    this.register(pluginInstance);
                }
            }
        } catch (e) {
            // No custom plugins or dir missing
        }
    }

    async initKnipAdapter() {
        this.context.knipCompatible = true;
    }

    register(plugin) {
        this.plugins.set(plugin.name, plugin);
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
}
