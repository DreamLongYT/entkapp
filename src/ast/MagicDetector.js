import path from 'path';
import fs from 'fs/promises';

/**
 * Ecosystem Entry Point Manifest & Dynamic Framework Router Heuristic Validator
 * Intercepts implicit conventions to handle cases where direct import statements are absent.
 */
export class MagicDetector {
  constructor(context) {
    this.context = context;
    this.manifestSchemaRules = this.compileEcosystemSchemaMatrices();
  }

  /**
   * Compiles explicit layout definitions to handle various web development environments.
   */
  compileEcosystemSchemaMatrices() {
    return {
      nextjs: {
        configFiles: ['next.config.js', 'next.config.mjs', 'next.config.ts'],
        routePatterns: [
          /\/pages\/api\//,
          /\/pages\/[a-zA-Z0-9_\-\[\]]+/i,
          /\/app\/([\w\-\[\]]+\/)+(page|route|layout|loading|error|not-found)\.(ts|tsx|js|jsx)$/
        ],
        requiredSystemContracts: ['default', 'getServerSideProps', 'getStaticProps', 'getStaticPaths', 'generateMetadata', 'middleware']
      },
      nuxt: {
        configFiles: ['nuxt.config.js', 'nuxt.config.ts'],
        routePatterns: [
          /\/pages\//,
          /\/server\/(api|routes|middleware)\//,
          /\/components\/[a-zA-Z0-9_\-\/]+\.vue$/
        ],
        requiredSystemContracts: ['default']
      },
      remix: {
        configFiles: ['remix.config.js', 'vite.config.js', 'vite.config.ts'],
        routePatterns: [
          /\/app\/routes\//,
          /\/app\/root\.(tsx|jsx)$/
        ],
        requiredSystemContracts: ['default', 'loader', 'action', 'meta', 'links']
      },
      sveltekit: {
        configFiles: ['svelte.config.js', 'vite.config.ts'],
        routePatterns: [
          /\+page\.(svelte|ts|js)$/,
          /\+page\.server\.(ts|js)$/,
          /\+layout\.(svelte|ts|js)$/,
          /\+server\.(ts|js)$/
        ],
        requiredSystemContracts: ['load', 'actions', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH']
      },
      astro: {
        configFiles: ['astro.config.mjs', 'astro.config.cjs', 'astro.config.ts'],
        routePatterns: [
          /\/src\/pages\/.*\.astro$/,
          /\/src\/pages\/.*\.(ts|js)$/
        ],
        requiredSystemContracts: ['default', 'getStaticPaths']
      }
    };
  }

  /**
   * Audits the project context to map active micro-framework ecosystems.
   * @param {string} baseContextDirectory - Root file workspace context execution vector path
   */
  async identifyActiveProjectEcosystems(baseContextDirectory) {
    const activeFrameworkFlags = [];
    
    for (const [frameworkKey, criteria] of Object.entries(this.manifestSchemaRules)) {
      for (const configFile of criteria.configFiles) {
        try {
          await fs.access(path.join(baseContextDirectory, configFile));
          activeFrameworkFlags.push(frameworkKey);
          break; // Stop scanning once config criteria is found
        } catch {
          // File path criteria absent; proceed to standard verification loops
        }
      }
    }
    
    // Universal infrastructure overrides (testing platforms and common bundlers)
    activeFrameworkFlags.push('universal-tooling-vectors');
    return activeFrameworkFlags;
  }

  /**
   * Assesses if a file path acts as an implicit route entry point.
   */
  isImplicitlyRequiredByEcosystem(absolutePath, activeFrameworks) {
    const normalizedSystemPath = absolutePath.replace(/\\/g, '/');

    for (const framework of activeFrameworks) {
      const frameworkRules = this.manifestSchemaRules[framework];
      if (!frameworkRules) continue;

      const matchesPattern = frameworkRules.routePatterns.some(regex => regex.test(normalizedSystemPath));
      if (matchesPattern) return true;
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
      '.eslintrc.', 'prettier.config.', '.postcssrc.', 'postcss.config.'
    ];
    
    return testEnvironments.some(matchPattern => normalizedPath.includes(matchPattern));
  }

  /**
   * Challenge #4 Framework Overrides. Protects interface boundaries from false positive report flags.
   */
  injectVirtualConsumerEdges(filePath, fileNode, activeFrameworks) {
    if (!this.isImplicitlyRequiredByEcosystem(filePath, activeFrameworks)) return;

    // Retain entry point elements within memory to keep verification safe
    fileNode.isLibraryEntry = true;

    // Apply dynamic exports coverage metrics based on active platform contracts
    const normalizedPath = filePath.replace(/\\/g, '/');

    for (const framework of activeFrameworks) {
      const frameworkRules = this.manifestSchemaRules[framework];
      if (!frameworkRules) continue;

      // If the file path matches the active framework schema, protect its interface keywords
      const appliesToFramework = frameworkRules.routePatterns.some(regex => regex.test(normalizedPath));
      if (appliesToFramework) {
        frameworkRules.requiredSystemContracts.forEach(contractMethodToken => {
          if (fileNode.internalExports.has(contractMethodToken)) {
            // Emulate active local reference linkages to protect the export
            fileNode.instantiatedIdentifiers.add(contractMethodToken);
          }
        });
      }
    }
  }
}
