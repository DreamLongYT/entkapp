import { loadAdditionalPlugins } from "./ecosystems/PluginLoader.js";
import path from 'path';
import fs from 'fs/promises';
import { pathToFileURL } from 'url';
import { AllPluginClasses } from './ecosystems/UltimateBundle.js';
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
        

        AllPluginClasses.forEach(PluginClass => {
            this.register(new PluginClass(this.context));
        });
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

    /**
     * Version 5.4.0: Collect entry points from all plugins for a given file.
     * @param {string} content - The file content
     * @param {string} filePath - The absolute path to the file
     * @returns {Array<string>} List of detected entry points
     */
    detectEntryPointsFromContent(content, filePath) {
        const entryPoints = [];
        for (const plugin of this.plugins.values()) {
            if (typeof plugin.detectEntryPoints === 'function') {
                try {
                    const detected = plugin.detectEntryPoints(content, filePath);
                    if (Array.isArray(detected)) {
                        entryPoints.push(...detected);
                    }
                } catch (e) {
                    if (this.context?.verbose) {
                        console.warn(`[PluginRegistry] Entry detection failed for plugin "${plugin.name}" on ${filePath}:`, e.message);
                    }
                }
            }
        }
        return entryPoints;
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
     * Version 5.3.0: Run content analysis on a node using all active plugins.
     * @param {GraphNode} node - The node to analyze
     * @param {string} filePath - The absolute path to the file
     */
    async runPluginAnalysis(node, filePath) {
        for (const plugin of this.plugins.values()) {
            if (typeof plugin.analyze === 'function') {
                try {
                    await plugin.analyze(node, filePath);
                } catch (e) {
                    if (this.context?.verbose) {
                        console.warn(`[PluginRegistry] Analysis failed for plugin "${plugin.name}" on ${filePath}:`, e.message);
                    }
                }
            }
        }
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
