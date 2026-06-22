import path from 'path';
import fs from 'fs/promises';
import { PluginRegistry } from '../plugins/PluginRegistry.js';

/**
 * Ecosystem Entry Point Manifest & Dynamic Framework Router Heuristic Validator
 * Intercepts implicit conventions to handle cases where direct import statements are absent.
 * Now refactored to use a pluggable architecture.
 * Version 5.4.0: Added detectEntryPointsFromPlugins() for dynamic framework entry detection.
 */
export class MagicDetector {
  constructor(context) {
    this.context = context;
    this.registry = new PluginRegistry(context);
    this.isInitialized = false;
  }

  async ensureInitialized(baseDir) {
    if (this.isInitialized) return;
    await this.registry.init(baseDir || process.cwd());
    this.isInitialized = true;
  }

  /**
   * Audits the project context to map active micro-framework ecosystems.
   */
  async identifyActiveProjectEcosystems(baseContextDirectory) {
    await this.ensureInitialized(baseContextDirectory);
    const activePlugins = await this.registry.getActivePlugins(baseContextDirectory);
    const activeFrameworkFlags = activePlugins.map(p => p.name);
    activeFrameworkFlags.push('universal-tooling-vectors');
    return activeFrameworkFlags;
  }

  /**
   * Version 5.4.0: Delegates entry point detection to the plugin registry.
   * @param {string} content - The file content
   * @param {string} filePath - The absolute path to the file
   * @returns {Array<string>} List of detected entry points
   */
  async detectEntryPointsFromPlugins(content, filePath) {
    await this.ensureInitialized();
    return this.registry.detectEntryPointsFromContent(content, filePath);
  }

  /**
   * Assesses if a file path acts as an implicit route entry point.
   */
  async isImplicitlyRequiredByEcosystem(absolutePath, activeFrameworks, baseDir) {
    await this.ensureInitialized();
    const normalizedSystemPath = absolutePath.replace(/\\/g, '/');

    const plugins = this.registry.getPlugins();
    for (const plugin of plugins) {
      if (activeFrameworks.includes(plugin.name)) {
        const patterns = plugin.getRoutePatterns();
        if (patterns.some(regex => regex.test(normalizedSystemPath))) {
          return true;
        }
      }
    }

    if (this.isCoreToolingSuiteElement(normalizedSystemPath)) {
      return true;
    }

    return false;
  }

  /**
   * Version 5.3.0: Delegates content analysis to the plugin registry.
   */
  async runPluginContentAnalysis(node, absolutePath) {
    await this.ensureInitialized();
    await this.registry.runPluginAnalysis(node, absolutePath);
  }

  isCoreToolingSuiteElement(normalizedPath) {
    if (/\.(test|spec|e2e|cy)\.(js|ts|tsx|jsx)$/i.test(normalizedPath)) return true;
    if (/\.stories\.(js|ts|tsx|jsx)$/i.test(normalizedPath)) return true;

    const configFragments = [
      'jest.config.', 'vitest.config.', 'vitest.workspace.',
      'playwright.config.', 'cypress.config.',
      'webpack.config.', 'vite.config.', 'rollup.config.',
      'esbuild.config.', 'parcel.config.',
      'tsup.config.', 'unbuild.config.', 'pkgroll.config.',
      'tailwind.config.', 'postcss.config.', '.postcssrc.',
      '.eslintrc.', 'eslint.config.', 'prettier.config.', '.prettierrc.',
      '.stylelintrc.', 'stylelint.config.',
      'biome.json', '.oxlintrc.',
      '.babelrc.', 'babel.config.',
      '.commitlintrc.', 'commitlint.config.',
      '.lintstagedrc.', 'lint-staged.config.',
      'typedoc.config.', 'typedoc.json',
      'turbo.json', 'nx.json', 'lerna.json',
      'knip.config.', 'knip.json',
      'syncpack.config.',
      'WorkerTaskRunner.js'
    ];
    if (configFragments.some(f => normalizedPath.includes(f))) return true;

    const entryPatterns = [
      // CLI binaries
      '/bin/cli.js', '/bin/cli.ts', '/bin/cli.mjs',
      '/bin/index.js', '/bin/index.ts',
      // Standard package entry points (poly-extension support)
      '/index.js', '/index.ts', '/index.jsx', '/index.tsx', '/index.mjs', '/index.cjs',
      // Server / app entry points
      '/src/main.ts', '/src/main.js',
      '/src/app.ts', '/src/app.js',
      '/src/api/HeadlessAPI.js', '/src/api/PluginSDK.js',
      '/main.ts', '/main.js',
      '/app.ts', '/app.js',
    ];
    if (entryPatterns.some(p => normalizedPath.endsWith(p))) return true;

    if (/\/app\/(page|layout|loading|error|not-found|template|default|route|middleware)\.(js|ts|tsx|jsx)$/.test(normalizedPath)) return true;
    if (/\/pages\/.*\.(js|ts|tsx|jsx)$/.test(normalizedPath)) return true;
    if (/\/pages\/api\/.*\.(js|ts)$/.test(normalizedPath)) return true;
    if (/\/middleware\.(js|ts)$/.test(normalizedPath)) return true;
    if (/\/next\.config\.(js|ts|mjs|cjs)$/.test(normalizedPath)) return true;

    if (/\/app\/routes\/.*\.(js|ts|tsx|jsx)$/.test(normalizedPath)) return true;
    if (/\/app\/root\.(js|ts|tsx|jsx)$/.test(normalizedPath)) return true;
    if (/\/app\/entry\.(client|server)\.(js|ts|tsx|jsx)$/.test(normalizedPath)) return true;

    if (/\/\+page(\.(server|client))?\.(svelte|js|ts)$/.test(normalizedPath)) return true;
    if (/\/\+layout(\.(server|client))?\.(svelte|js|ts)$/.test(normalizedPath)) return true;
    if (/\/\+error\.(svelte|js|ts)$/.test(normalizedPath)) return true;
    if (/\/\+server\.(js|ts)$/.test(normalizedPath)) return true;
    if (/\/svelte\.config\.(js|ts|mjs)$/.test(normalizedPath)) return true;

    if (/\/src\/pages\/.*\.astro$/.test(normalizedPath)) return true;
    if (/\/src\/layouts\/.*\.astro$/.test(normalizedPath)) return true;
    if (/\/astro\.config\.(mjs|js|ts)$/.test(normalizedPath)) return true;

    if (/\/pages\/.*\.vue$/.test(normalizedPath)) return true;
    if (/\/layouts\/.*\.vue$/.test(normalizedPath)) return true;
    if (/\/server\/api\/.*\.(js|ts)$/.test(normalizedPath)) return true;
    if (/\/nuxt\.config\.(js|ts|mjs)$/.test(normalizedPath)) return true;

    if (/\/vite\.config\.(js|ts|mjs)$/.test(normalizedPath)) return true;

    if (/\/main\.(ts|js)$/.test(normalizedPath)) return true;
    if (/\/app\.module\.(ts|js)$/.test(normalizedPath)) return true;
    if (/\/angular\.json$/.test(normalizedPath)) return true;

    if (/\/app\/_layout\.(js|ts|tsx|jsx)$/.test(normalizedPath)) return true;
    if (/\/app\/index\.(js|ts|tsx|jsx)$/.test(normalizedPath)) return true;

    return false;
  }

  /**
   * Challenge #4 Framework Overrides. Protects interface boundaries from false positive report flags.
   */
  async injectVirtualConsumerEdges(filePath, fileNode, activeFrameworks) {
    await this.ensureInitialized();
    if (!await this.isImplicitlyRequiredByEcosystem(filePath, activeFrameworks)) return;

    fileNode.isEntry = true;

    const normalizedPath = filePath.replace(/\\/g, '/');
    const plugins = this.registry.getPlugins();

    for (const plugin of plugins) {
      if (activeFrameworks.includes(plugin.name)) {
        const patterns = plugin.getRoutePatterns();
        const appliesToFramework = patterns.some(regex => regex.test(normalizedPath));
        
        if (appliesToFramework) {
          const contracts = plugin.getRequiredSystemContracts();
          contracts.forEach(contractMethodToken => {
            if (fileNode.internalExports.has(contractMethodToken)) {
              fileNode.instantiatedIdentifiers.add(contractMethodToken);
            }
          });
        }
      }
    }
  }
}
