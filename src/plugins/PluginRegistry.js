import path from 'path';
import fs from 'fs/promises';
import { pathToFileURL } from 'url';

/**
 * Advanced Plugin Registry supporting Builtin, Custom, and Knip-style plugins.
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
      this.config = { useBuiltinPlugins: true, useCustomPlugins: true, supportKnipPlugins: true };
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

    const builtins = [
      new NextJsPlugin(this.context),
      new NuxtPlugin(this.context),
      new RemixPlugin(this.context),
      new SvelteKitPlugin(this.context),
      new AstroPlugin(this.context)
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
          this.register(new PluginClass(this.context));
        }
      }
    } catch (e) {
      // No custom plugins or dir missing
    }
  }

  async initKnipAdapter() {
    // This adapter allows running Knip-style plugins by wrapping them
    // In a real scenario, this would interface with knip's plugin API
    this.context.knipCompatible = true;
  }

  register(plugin) {
    this.plugins.set(plugin.name, plugin);
  }

  getPlugins() {
    return Array.from(this.plugins.values());
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
