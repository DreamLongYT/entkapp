import path from 'path';
import fs from 'fs/promises';
import { PluginRegistry } from '../plugins/PluginRegistry.js';

/**
 * Ecosystem Entry Point Manifest & Dynamic Framework Router Heuristic Validator
 * Intercepts implicit conventions to handle cases where direct import statements are absent.
 * Now refactored to use a pluggable architecture.
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
   * @param {string} baseContextDirectory - Root file workspace context execution vector path
   */
  async identifyActiveProjectEcosystems(baseContextDirectory) {
    await this.ensureInitialized(baseContextDirectory);
    const activePlugins = await this.registry.getActivePlugins(baseContextDirectory);
    const activeFrameworkFlags = activePlugins.map(p => p.name);
    
    // Universal infrastructure overrides (testing platforms and common bundlers)
    activeFrameworkFlags.push('universal-tooling-vectors');
    return activeFrameworkFlags;
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

    // Apply baseline platform rules (Test suites, lint parameters, continuous integration files)
    if (this.isCoreToolingSuiteElement(normalizedSystemPath)) {
      return true;
    }

    return false;
  }

  isCoreToolingSuiteElement(normalizedPath) {
    // Testing and execution matrices rules configuration keys
    if (/\.(test|spec|e2e|cy)\.(js|ts|tsx|jsx|stories\.tsx|stories\.ts)$/i.test(normalizedPath)) return true;
    
    // Testing tools and structural environment frameworks configuration keys
    const testEnvironments = [
      'jest.config.', 'vitest.config.', 'playwright.config.', 'cypress.config.',
      'webpack.config.', 'vite.config.', 'rollup.config.', 'tailwind.config.',
      '.eslintrc.', 'prettier.config.', '.postcssrc.', 'postcss.config.',
      'bin/cli.js', 'index.js', 'WorkerTaskRunner.js'
    ];
    
    return testEnvironments.some(matchPattern => normalizedPath.includes(matchPattern));
  }

  /**
   * Challenge #4 Framework Overrides. Protects interface boundaries from false positive report flags.
   */
  async injectVirtualConsumerEdges(filePath, fileNode, activeFrameworks) {
    await this.ensureInitialized();
    if (!await this.isImplicitlyRequiredByEcosystem(filePath, activeFrameworks)) return;

    // Retain entry point elements within memory to keep verification safe
    fileNode.isLibraryEntry = true;

    // Apply dynamic exports coverage metrics based on active platform contracts
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
              // Emulate active local reference linkages to protect the export
              fileNode.instantiatedIdentifiers.add(contractMethodToken);
            }
          });
        }
      }
    }
  }
}
