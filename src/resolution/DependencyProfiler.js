import fs from 'fs/promises';
import path from 'path';

/**
 * Advanced Dependency Profiling Engine.
 * Traces Peer Dependencies and Implicit Tooling Invocations.
 */
export class DependencyProfiler {
  constructor(context) {
    this.context = context;
    this.binaryToPackageMap = {
      'tsc': 'typescript',
      'jest': 'jest',
      'vitest': 'vitest',
      'eslint': 'eslint',
      'prettier': 'prettier',
      'vite': 'vite',
      'next': 'next',
      'nuxt': 'nuxt',
      'astro': 'astro',
      'playwright': 'playwright',
      'cypress': 'cypress',
      'tailwind': 'tailwindcss',
      'postcss': 'postcss'
    };
  }

  /**
   * Scans package.json scripts and CI files for binary usage.
   */
  async traceImplicitInvocations(projectRoot) {
    const usedPackages = new Set();
    
    // 1. Scan package.json scripts
    try {
      const pkgJsonPath = path.join(projectRoot, 'package.json');
      const pkg = JSON.parse(await fs.readFile(pkgJsonPath, 'utf8'));
      
      if (pkg.scripts) {
        for (const script of Object.values(pkg.scripts)) {
          this.extractPackagesFromScript(script, usedPackages);
        }
      }
    } catch (e) {}

    // 2. Scan CI workflows
    try {
      const githubWorkflows = path.join(projectRoot, '.github/workflows');
      const files = await fs.readdir(githubWorkflows).catch(() => []);
      for (const file of files) {
        if (file.endsWith('.yml') || file.endsWith('.yaml')) {
          const content = await fs.readFile(path.join(githubWorkflows, file), 'utf8');
          this.extractPackagesFromScript(content, usedPackages);
        }
      }
    } catch (e) {}

    return usedPackages;
  }

  extractPackagesFromScript(script, collector) {
    // Basic regex to find binary-like words
    const words = script.split(/[\s&|;]+/);
    for (const word of words) {
      const cleanWord = word.replace(/['"]/g, '');
      if (this.binaryToPackageMap[cleanWord]) {
        collector.add(this.binaryToPackageMap[cleanWord]);
      }
    }
  }

  /**
   * Resolves peer dependencies for a given set of used packages.
   */
  async resolvePeerDependencies(usedPackages, projectRoot) {
    const peerDeps = new Set();
    const nodeModules = path.join(projectRoot, 'node_modules');

    for (const pkgName of usedPackages) {
      try {
        const pkgJsonPath = path.join(nodeModules, pkgName, 'package.json');
        const pkg = JSON.parse(await fs.readFile(pkgJsonPath, 'utf8'));
        if (pkg.peerDependencies) {
          Object.keys(pkg.peerDependencies).forEach(dep => peerDeps.add(dep));
        }
      } catch (e) {}
    }
    return peerDeps;
  }
}
