/**
 * ============================================================================
 * Generic Ecosystem Plugins for entkapp v5.0.0
 * ============================================================================
 * Nuxt, Remix, SvelteKit, Astro, VitePress, and more.
 * v5.0.0: All plugins implement getRequiredPackages() for dependency detection.
 */
import path from 'path';
import fs from 'fs/promises';
import { BasePlugin } from '../BasePlugin.mjs';

export class NuxtPlugin extends BasePlugin {
  get name() { return 'nuxt'; }
  getConfigFiles() { return ['nuxt.config.mjs', 'nuxt.config.ts']; }
  getRequiredPackages() { return [{ name: 'nuxt', dev: false }]; }
  getRoutePatterns() {
    return [/\/pages\//, /\/server\/(api|routes|middleware)\//, /\/components\/[a-zA-Z0-9_\-\/]+\.vue$/];
  }
  getRequiredSystemContracts() { return ['default']; }
  async isActive(baseDir) {
    for (const file of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, file)); return true; } catch {}
    }
    return false;
  }
}

export class RemixPlugin extends BasePlugin {
  get name() { return 'remix'; }
  getConfigFiles() { return ['remix.config.mjs', 'vite.config.mjs', 'vite.config.ts']; }
  getRequiredPackages() {
    return [
      { name: '@remix-run/react', dev: false },
      { name: '@remix-run/node', dev: false, optional: true },
    ];
  }
  getRoutePatterns() { return [/\/app\/routes\//, /\/app\/root\.(tsx|jsx)$/]; }
  getRequiredSystemContracts() { return ['default', 'loader', 'action', 'meta', 'links']; }
  async isActive(baseDir) {
    for (const file of this.getConfigFiles()) {
      try {
        const content = await fs.readFile(path.join(baseDir, file), 'utf8');
        if (content.includes('@remix-run/') || content.includes('remix')) return true;
      } catch {}
    }
    return false;
  }
}

export class SvelteKitPlugin extends BasePlugin {
  get name() { return 'sveltekit'; }
  getConfigFiles() { return ['svelte.config.mjs', 'vite.config.ts']; }
  getRequiredPackages() {
    return [
      { name: '@sveltejs/kit', dev: false },
      { name: 'svelte', dev: false },
    ];
  }
  getRoutePatterns() {
    return [/\+page\.(svelte|ts|js)$/, /\+page\.server\.(ts|js)$/, /\+layout\.(svelte|ts|js)$/, /\+server\.(ts|js)$/];
  }
  getRequiredSystemContracts() { return ['load', 'actions', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH']; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, 'svelte.config.mjs')); return true; } catch { return false; }
  }
}

export class AstroPlugin extends BasePlugin {
  get name() { return 'astro'; }
  getConfigFiles() { return ['astro.config.mjs', 'astro.config.cjs', 'astro.config.ts']; }
  getRequiredPackages() { return [{ name: 'astro', dev: false }]; }
  getRoutePatterns() { return [/\/src\/pages\/.*\.astro$/, /\/src\/pages\/.*\.(ts|js)$/]; }
  getRequiredSystemContracts() { return ['default', 'getStaticPaths']; }
  async isActive(baseDir) {
    for (const file of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, file)); return true; } catch {}
    }
    return false;
  }
}

export class VitepressPlugin extends BasePlugin {
  get name() { return 'vitepress'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'vitepress', dev: true }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      const hasDep = !!(pkgJson.dependencies?.vitepress || pkgJson.devDependencies?.vitepress);
      const possibleDirs = ['.vitepress', 'docs/.vitepress', '.docs/.vitepress'];
      for (const d of possibleDirs) {
        try { await fs.access(path.join(baseDir, d)); return true; } catch {}
      }
      return hasDep;
    } catch { return false; }
  }
  async onDiscovery({ pkgDir, data, reachableFiles, queue, projectGraph, context }) {
    const hasVitepressDir = Array.from(projectGraph.keys()).some(f => f.includes('/.vitepress/'));
    const hasVitepressDep = !!(data.devDependencies?.vitepress || data.dependencies?.vitepress);
    if (hasVitepressDir && hasVitepressDep) {
      for (const [filePath, _] of projectGraph.entries()) {
        if (filePath.includes('/.vitepress/') && !reachableFiles.has(filePath)) {
          reachableFiles.add(filePath);
          queue.push(filePath);
        }
      }
      if (!context.consumedRootPackages) context.consumedRootPackages = new Set();
      context.consumedRootPackages.add('vitepress');
      context.consumedRootPackages.add('vue');
    } else if (hasVitepressDir && !hasVitepressDep) {
      if (!context.unlistedDependencies) context.unlistedDependencies = [];
      context.unlistedDependencies.push({
        name: 'vitepress',
        reason: 'Found .vitepress configuration directory but package is not in package.json'
      });
    }
  }
}

export class GatsbyPlugin extends BasePlugin {
  get name() { return 'gatsby'; }
  getConfigFiles() { return ['gatsby-config.mjs', 'gatsby-config.ts', 'gatsby-node.mjs', 'gatsby-node.ts']; }
  getRequiredPackages() { return [{ name: 'gatsby', dev: false }]; }
  getRoutePatterns() { return [/\/src\/pages\//, /\/src\/templates\//]; }
  getRequiredSystemContracts() { return ['default', 'getServerData', 'config']; }
  async isActive(baseDir) {
    for (const file of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, file)); return true; } catch {}
    }
    return false;
  }
}

export class RedwoodPlugin extends BasePlugin {
  get name() { return 'redwood'; }
  getConfigFiles() { return ['redwood.toml']; }
  getRequiredPackages() { return [{ name: '@redwoodjs/core', dev: true }]; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, 'redwood.toml')); return true; } catch { return false; }
  }
  getRoutePatterns() { return [/\/web\/src\/pages\//, /\/api\/src\/functions\//]; }
}
