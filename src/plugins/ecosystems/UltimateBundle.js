/**
 * ============================================================================
 * Ultimate Ecosystem Bundle for entkapp v5.2.2
 * ============================================================================
 * Combined support for ALL frameworks, libraries, and tools.
 * Consolidated from the entire entkapp ecosystem.
 */
import path from 'path';
import fs from 'fs/promises';
import { BasePlugin } from '../BasePlugin.js';
import { FrameworkConfigParser } from '../../resolution/FrameworkConfigParser.js';


export class GraphQLPlugin extends BasePlugin {
  get name() { return 'graphql'; }
  getConfigFiles() { return ['package.json', 'graphql.config.js', 'graphql.config.ts', '.graphqlconfig', 'graphql.config.yml']; }
  getRequiredPackages() {
    return [{ name: 'graphql', dev: false }];
  }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.graphql || pkgJson.devDependencies?.graphql || pkgJson.dependencies?.['@apollo/client']);
    } catch { return false; }
  }
  async analyze(node, filePath) {
    const gqlPattern = /gql\s*`([\s\S]*?)`/g;
    const matches = node.rawCode?.match(gqlPattern) || [];
    if (matches.length > 0) node.graphqlQueries = matches;
  }
}

export class ApolloPlugin extends BasePlugin {
  get name() { return 'apollo'; }
  getConfigFiles() { return ['package.json', 'apollo.config.js', 'apollo.config.ts']; }
  getRequiredPackages() {
    return [
      { name: '@apollo/client', dev: false },
      { name: '@apollo/server', dev: false, optional: true },
    ];
  }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['@apollo/client'] || pkgJson.dependencies?.['@apollo/server'] ||
               pkgJson.devDependencies?.['@apollo/client'] || pkgJson.devDependencies?.['@apollo/server']);
    } catch { return false; }
  }
  async analyze(node) {
    if (node.rawCode?.includes('ApolloClient') || node.rawCode?.includes('ApolloServer')) node.isEntry = true;
  }
}

export class DatabasePlugin extends BasePlugin {
  get name() { return 'database'; }
  getConfigFiles() { return ['package.json', 'prisma/schema.prisma', 'drizzle.config.ts', 'drizzle.config.js', 'ormconfig.json']; }
  getRequiredPackages() {
    return [
      { name: '@prisma/client', dev: false, optional: true },
      { name: 'drizzle-orm', dev: false, optional: true },
      { name: 'typeorm', dev: false, optional: true },
    ];
  }
  async analyze(node, filePath) {
    if (node.explicitImports?.has('@prisma/client') || node.explicitImports?.has('drizzle-orm'))
      node.usesDatabase = true;
  }
}

export class PrismaPlugin extends BasePlugin {
  get name() { return 'prisma'; }
  getConfigFiles() { return ['prisma/schema.prisma', 'schema.prisma']; }
  getRequiredPackages() {
    return [
      { name: '@prisma/client', dev: false },
      { name: 'prisma', dev: true },
    ];
  }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['@prisma/client'] || pkgJson.devDependencies?.prisma);
    } catch { return false; }
  }
  async analyze(node) {
    if (node.rawCode?.includes('new PrismaClient()')) node.isEntry = true;
  }
}

export class DrizzlePlugin extends BasePlugin {
  get name() { return 'drizzle'; }
  getConfigFiles() { return ['drizzle.config.ts', 'drizzle.config.js', 'drizzle.config.mjs']; }
  getRequiredPackages() {
    return [
      { name: 'drizzle-orm', dev: false },
      { name: 'drizzle-kit', dev: true },
    ];
  }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['drizzle-orm'] || pkgJson.devDependencies?.['drizzle-orm']);
    } catch { return false; }
  }
  async analyze(node) {
    if (node.rawCode?.includes('drizzle(')) node.isEntry = true;
  }
}

export class MongoosePlugin extends BasePlugin {
  get name() { return 'mongoose'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() {
    return [{ name: 'mongoose', dev: false }];
  }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.mongoose || pkgJson.devDependencies?.mongoose);
    } catch { return false; }
  }
  async analyze(node) {
    if (node.rawCode?.includes('mongoose.model(')) node.isEntry = true;
  }
}

export class SupabasePlugin extends BasePlugin {
  get name() { return 'supabase'; }
  getConfigFiles() { return ['supabase/config.toml', '.env', '.env.local', 'package.json']; }
  getRequiredPackages() {
    return [{ name: '@supabase/supabase-js', dev: false }];
  }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['@supabase/supabase-js'] || pkgJson.devDependencies?.['@supabase/supabase-js']);
    } catch { return false; }
  }
  async analyze(node) {
    if (node.rawCode?.includes('createClient') && node.rawCode?.includes('supabase')) node.isEntry = true;
  }
}

export class FirebasePlugin extends BasePlugin {
  get name() { return 'firebase'; }
  getConfigFiles() { return ['firebase.json', '.firebaserc', 'package.json']; }
  getRequiredPackages() {
    return [{ name: 'firebase', dev: false }];
  }
  async isActive(baseDir) {
    for (const f of ['firebase.json', '.firebaserc']) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.firebase || pkgJson.devDependencies?.firebase);
    } catch { return false; }
  }
  async analyze(node) {
    if (node.rawCode?.includes('initializeApp') && node.rawCode?.includes('firebase')) node.isEntry = true;
  }
}

export class ClerkPlugin extends BasePlugin {
  get name() { return 'clerk'; }
  getConfigFiles() { return ['package.json', '.env', '.env.local']; }
  getRequiredPackages() {
    return [{ name: '@clerk/nextjs', dev: false, optional: true }, { name: '@clerk/clerk-react', dev: false, optional: true }];
  }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      const allDeps = { ...(pkgJson.dependencies || {}), ...(pkgJson.devDependencies || {}) };
      return Object.keys(allDeps).some(k => k.startsWith('@clerk/'));
    } catch { return false; }
  }
}

export class TRPCPlugin extends BasePlugin {
  get name() { return 'trpc'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() {
    return [{ name: '@trpc/server', dev: false }, { name: '@trpc/client', dev: false }];
  }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      const allDeps = { ...(pkgJson.dependencies || {}), ...(pkgJson.devDependencies || {}) };
      return Object.keys(allDeps).some(k => k.startsWith('@trpc/'));
    } catch { return false; }
  }
  getRequiredSystemContracts() { return ['router', 'procedure', 'createTRPCRouter']; }
}

export class NuxtPlugin extends BasePlugin {
  get name() { return 'nuxt'; }
  getConfigFiles() { return ['nuxt.config.js', 'nuxt.config.ts']; }
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
  detectEntryPoints(content, filePath) {
    if (this.getConfigFiles().some(f => filePath.endsWith(f))) {
      const parser = new FrameworkConfigParser(this.context);
      const { entries } = parser.parse(content, filePath);
      return Array.from(entries);
    }
    return [];
  }
  async analyze(node, filePath) {
    if (this.getConfigFiles().some(f => filePath.endsWith(f))) {
      node.isEntry = true;
      if (node.rawCode) {
        const parser = new FrameworkConfigParser(this.context);
        const { aliases, entries } = parser.parse(node.rawCode, filePath);
        if (aliases.size > 0) node.frameworkAliases = aliases;
        if (entries.size > 0) node.frameworkEntries = entries;
        if (node.rawCode.includes('modules:')) node.hasNuxtModules = true;
        if (node.rawCode.includes('components:')) node.hasNuxtComponentsConfig = true;
      }
    }
  }
}

export class RemixPlugin extends BasePlugin {
  get name() { return 'remix'; }
  getConfigFiles() { return ['remix.config.js', 'vite.config.js', 'vite.config.ts']; }
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
  detectEntryPoints(content, filePath) {
    if (filePath.endsWith('remix.config.js') || filePath.includes('vite.config.')) {
      const parser = new FrameworkConfigParser(this.context);
      const { entries } = parser.parse(content, filePath);
      return Array.from(entries);
    }
    return [];
  }
  async analyze(node, filePath) {
    if (filePath.endsWith('remix.config.js')) {
      node.isEntry = true;
      if (node.rawCode?.includes('ignoredRouteFiles:')) node.hasRemixIgnoredRoutes = true;
      if (node.rawCode?.includes('serverBuildPath:')) node.hasRemixServerBuildPath = true;
    }
  }
}

export class SvelteKitPlugin extends BasePlugin {
  get name() { return 'sveltekit'; }
  getConfigFiles() { return ['svelte.config.js', 'vite.config.ts']; }
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
    try { await fs.access(path.join(baseDir, 'svelte.config.js')); return true; } catch { return false; }
  }
  detectEntryPoints(content, filePath) {
    if (filePath.includes('svelte.config.')) {
      const parser = new FrameworkConfigParser(this.context);
      const { entries } = parser.parse(content, filePath);
      return Array.from(entries);
    }
    return [];
  }
  async analyze(node, filePath) {
    if (filePath.includes('svelte.config.')) {
      node.isEntry = true;
      if (node.rawCode) {
        const parser = new FrameworkConfigParser(this.context);
        const { aliases, entries } = parser.parse(node.rawCode, filePath);
        if (aliases.size > 0) {
          node.frameworkAliases = aliases;
          node.hasSvelteAliases = true;
        }
        if (entries.size > 0) node.frameworkEntries = entries;
        if (node.rawCode.includes('adapter:')) node.hasSvelteAdapter = true;
      }
    }
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
  detectEntryPoints(content, filePath) {
    if (this.getConfigFiles().some(f => filePath.endsWith(f))) {
      const parser = new FrameworkConfigParser(this.context);
      const { entries } = parser.parse(content, filePath);
      return Array.from(entries);
    }
    return [];
  }
  async analyze(node, filePath) {
    if (this.getConfigFiles().some(f => filePath.endsWith(f))) {
      node.isEntry = true;
      if (node.rawCode) {
        const parser = new FrameworkConfigParser(this.context);
        const { aliases, entries } = parser.parse(node.rawCode, filePath);
        if (aliases.size > 0) node.frameworkAliases = aliases;
        if (entries.size > 0) node.frameworkEntries = entries;
        if (node.rawCode.includes('integrations:')) node.hasAstroIntegrations = true;
        if (node.rawCode.includes('output:')) node.hasAstroOutputConfig = true;
      }
    }
  }
}

export class VitepressPlugin extends BasePlugin {
  get name() { return 'vitepress'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'vitepress', dev: true }]; }
  
  getRoutePatterns() {
    // Protection: Every file inside a .vitepress folder is treated as an entry point
    return [/\/\.vitepress\//];
  }

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

  async runDependencyDiagnostics(baseDir) {
    const diagnostics = await super.runDependencyDiagnostics(baseDir);
    
    let pkg = null;
    try {
      const raw = await fs.readFile(path.join(baseDir, 'package.json'), 'utf8');
      pkg = JSON.parse(raw);
    } catch { return diagnostics; }

    const scripts = pkg.scripts || {};
    const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    const hasVitepressDep = 'vitepress' in allDeps;
    
    // Check if any script uses vitepress
    const hasVitepressCommand = Object.values(scripts).some(s => s.includes('vitepress'));
    
    // Logic for .vitepress folder existence
    let hasVitepressFolder = false;
    const possibleDirs = ['.vitepress', 'docs/.vitepress', 'docs/docs/.vitepress'];
    for (const d of possibleDirs) {
      try {
        await fs.access(path.join(baseDir, d));
        hasVitepressFolder = true;
        break;
      } catch {}
    }

    // Scenario 1: build cmd/dependency exists but no folder -> unused dependency
    if ((hasVitepressCommand || hasVitepressDep) && !hasVitepressFolder) {
      diagnostics.push({
        plugin: this.name,
        severity: 'warning',
        message: `Plugin "${this.name}": "vitepress" is defined in package.json or scripts, but no ".vitepress" folder was found. This might be an unused dependency.`
      });
    }

    // Scenario 2: folder exists but no dependency -> missing dependency
    if (hasVitepressFolder && !hasVitepressDep) {
      diagnostics.push({
        plugin: this.name,
        severity: 'error',
        message: `Plugin "${this.name}": ".vitepress" folder exists, but "vitepress" package is not installed in package.json.`
      });
    }

    return diagnostics;
  }

  async analyze(node, filePath) {
    // If it's a config file inside .vitepress, mark it
    if (filePath.includes('/.vitepress/config.') || filePath.includes('/.vitepress/theme/')) {
      node.isEntry = true;
      node.isVitepressInternal = true;
    }
  }
}

export class GatsbyPlugin extends BasePlugin {
  get name() { return 'gatsby'; }
  getConfigFiles() { return ['gatsby-config.js', 'gatsby-config.ts', 'gatsby-node.js', 'gatsby-node.ts']; }
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

export class NextJsPlugin extends BasePlugin {
  get name() { return 'next'; }
  getConfigFiles() { return ['next.config.js', 'next.config.mjs', 'next.config.ts', 'next-env.d.ts']; }
  getRequiredPackages() { return [{ name: 'next', dev: false }]; }
  getRoutePatterns() {
    return [/\/app\/.*\/page\.(tsx|jsx)$/, /\/pages\/.*\.tsx$/, /\/app\/.*\/layout\.(tsx|jsx)$/];
  }
  async isActive(baseDir) {
    for (const file of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, file)); return true; } catch {}
    }
    return false;
  }
  async analyze(node, filePath) {
    if (this.getConfigFiles().some(f => filePath.endsWith(f))) {
      node.isEntry = true;
      if (node.rawCode?.includes('rewrites')) node.hasNextRewrites = true;
      if (node.rawCode?.includes('redirects')) node.hasNextRedirects = true;
      if (node.rawCode?.includes('images:')) node.hasNextImageConfig = true;
    }
  }
}

export class ReactPlugin extends BasePlugin {
  get name() { return 'react'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() {
    return [
      { name: 'react', dev: false },
      { name: 'react-dom', dev: false },
    ];
  }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.react || pkgJson.devDependencies?.react);
    } catch { return false; }
  }
}

export class VuePlugin extends BasePlugin {
  get name() { return 'vue'; }
  getConfigFiles() { return ['package.json', 'vue.config.js', 'vite.config.ts', 'vite.config.js']; }
  getRequiredPackages() {
    return [{ name: 'vue', dev: false }];
  }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.vue || pkgJson.devDependencies?.vue);
    } catch { return false; }
  }
}

export class SveltePlugin extends BasePlugin {
  get name() { return 'svelte'; }
  getConfigFiles() { return ['package.json', 'svelte.config.js']; }
  getRequiredPackages() {
    return [{ name: 'svelte', dev: false }];
  }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.svelte || pkgJson.devDependencies?.svelte);
    } catch { return false; }
  }
}

export class AngularPlugin extends BasePlugin {
  get name() { return 'angular'; }
  getConfigFiles() { return ['package.json', 'angular.json']; }
  getRequiredPackages() {
    return [
      { name: '@angular/core', dev: false },
      { name: '@angular/common', dev: false },
    ];
  }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['@angular/core'] || pkgJson.devDependencies?.['@angular/core']);
    } catch { return false; }
  }
}

export class PreactPlugin extends BasePlugin {
  get name() { return 'preact'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'preact', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.preact || pkgJson.devDependencies?.preact);
    } catch { return false; }
  }
}

export class SolidPlugin extends BasePlugin {
  get name() { return 'solid'; }
  getConfigFiles() { return ['package.json', 'vite.config.ts', 'vite.config.js']; }
  getRequiredPackages() { return [{ name: 'solid-js', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['solid-js'] || pkgJson.devDependencies?.['solid-js']);
    } catch { return false; }
  }
}

export class QwikPlugin extends BasePlugin {
  get name() { return 'qwik'; }
  getConfigFiles() { return ['package.json', 'vite.config.ts']; }
  getRequiredPackages() { return [{ name: '@builder.io/qwik', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['@builder.io/qwik'] || pkgJson.devDependencies?.['@builder.io/qwik']);
    } catch { return false; }
  }
}

export class LitPlugin extends BasePlugin {
  get name() { return 'lit'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'lit', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.lit || pkgJson.devDependencies?.lit);
    } catch { return false; }
  }
}

export class VitePlugin extends BasePlugin {
  get name() { return 'vite'; }
  getConfigFiles() { return ['vite.config.js', 'vite.config.ts', 'vite.config.mjs', 'vite.config.cjs', 'vite-env.d.ts']; }
  getRequiredPackages() { return [{ name: 'vite', dev: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    return false;
  }
  detectEntryPoints(content, filePath) {
    if (filePath.includes('vite.config.')) {
      const parser = new FrameworkConfigParser(this.context);
      const { entries } = parser.parse(content, filePath);
      return Array.from(entries);
    }
    return [];
  }
  async analyze(node, filePath) {
    if (filePath.includes('vite.config.')) {
      // Mark config as an entry so its own dependencies are tracked
      node.isEntry = true;
      
      // UPGRADE: Use FrameworkConfigParser for deep structural extraction
      if (node.rawCode) {
        const parser = new FrameworkConfigParser(this.context);
        const { aliases, entries } = parser.parse(node.rawCode, filePath);
        
        if (aliases.size > 0) {
          node.frameworkAliases = aliases;
          node.viteAliasesDetected = true;
        }
        
        if (entries.size > 0) {
          node.frameworkEntries = entries;
          node.hasCustomViteInputs = true;
        }

        // Detect Plugins (Keep existing simple check)
        const pluginsPattern = /plugins\s*:\s*\[([\s\S]*?)\]/g;
        if (pluginsPattern.test(node.rawCode)) {
          node.hasVitePlugins = true;
        }
      }
    }
  }
}

export class EsbuildPlugin extends BasePlugin {
  get name() { return 'esbuild'; }
  getConfigFiles() { return ['esbuild.config.js', 'esbuild.config.mjs', 'esbuild.config.ts']; }
  getRequiredPackages() { return [{ name: 'esbuild', dev: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    return false;
  }
}

export class RollupPlugin extends BasePlugin {
  get name() { return 'rollup'; }
  getConfigFiles() { return ['rollup.config.js', 'rollup.config.mjs', 'rollup.config.ts']; }
  getRequiredPackages() { return [{ name: 'rollup', dev: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    return false;
  }
}

export class WebpackPlugin extends BasePlugin {
  get name() { return 'webpack'; }
  getConfigFiles() { return ['webpack.config.js', 'webpack.config.ts', 'webpack.config.mjs', 'webpack.config.cjs']; }
  getRequiredPackages() { return [{ name: 'webpack', dev: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    return false;
  }
  detectEntryPoints(content, filePath) {
    if (this.getConfigFiles().some(f => filePath.endsWith(f))) {
      const parser = new FrameworkConfigParser(this.context);
      const { entries } = parser.parse(content, filePath);
      return Array.from(entries);
    }
    return [];
  }
  detectEntryPoints(content, filePath) {
    if (this.getConfigFiles().some(f => filePath.endsWith(f))) {
      const parser = new FrameworkConfigParser(this.context);
      const { entries } = parser.parse(content, filePath);
      return Array.from(entries);
    }
    return [];
  }
  async analyze(node, filePath) {
    if (this.getConfigFiles().some(f => filePath.endsWith(f))) {
      node.isEntry = true;
      if (node.rawCode?.includes('entry:')) node.hasWebpackEntries = true;
      if (node.rawCode?.includes('resolve:')) node.hasWebpackResolve = true;
      if (node.rawCode?.includes('plugins:')) node.hasWebpackPlugins = true;
    }
  }
}

export class ParcelPlugin extends BasePlugin {
  get name() { return 'parcel'; }
  getConfigFiles() { return ['.parcelrc', '.parcelrc.json']; }
  getRequiredPackages() { return [{ name: 'parcel', dev: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    return false;
  }
}

export class TurboPlugin extends BasePlugin {
  get name() { return 'turbo'; }
  getConfigFiles() { return ['turbo.json']; }
  getRequiredPackages() { return [{ name: 'turbo', dev: true }]; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, 'turbo.json')); return true; } catch { return false; }
  }
}

export class NxPlugin extends BasePlugin {
  get name() { return 'nx'; }
  getConfigFiles() { return ['nx.json', 'workspace.json']; }
  getRequiredPackages() { return [{ name: 'nx', dev: true }]; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, 'nx.json')); return true; } catch { return false; }
  }
}

export class TailwindPlugin extends BasePlugin {
  get name() { return 'tailwind'; }
  getConfigFiles() { return ['tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.mjs', 'tailwind.config.cjs']; }
  getRequiredPackages() { return [{ name: 'tailwindcss', dev: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    return false;
  }
  async analyze(node, filePath) {
    if (this.getConfigFiles().some(f => filePath.endsWith(f))) {
      node.isEntry = true;
      if (node.rawCode?.includes('content:')) node.hasTailwindContent = true;
      if (node.rawCode?.includes('theme:')) node.hasTailwindTheme = true;
      if (node.rawCode?.includes('plugins:')) node.hasTailwindPlugins = true;
    }
  }
}

export class PostcssPlugin extends BasePlugin {
  get name() { return 'postcss'; }
  getConfigFiles() { return ['postcss.config.js', 'postcss.config.cjs', 'postcss.config.mjs', 'postcss.config.ts', '.postcssrc']; }
  getRequiredPackages() { return [{ name: 'postcss', dev: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    return false;
  }
}

export class UnoCSSPlugin extends BasePlugin {
  get name() { return 'unocss'; }
  getConfigFiles() { return ['uno.config.ts', 'uno.config.js']; }
  getRequiredPackages() { return [{ name: 'unocss', dev: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    return false;
  }
}

export class StylelintPlugin extends BasePlugin {
  get name() { return 'stylelint'; }
  getConfigFiles() { return ['.stylelintrc', 'stylelint.config.js']; }
  getRequiredPackages() { return [{ name: 'stylelint', dev: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    return false;
  }
}

export class EslintPlugin extends BasePlugin {
  get name() { return 'eslint'; }
  getConfigFiles() { return ['.eslintrc', 'eslint.config.js']; }
  getRequiredPackages() { return [{ name: 'eslint', dev: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    return false;
  }
}

export class PrettierPlugin extends BasePlugin {
  get name() { return 'prettier'; }
  getConfigFiles() { return ['.prettierrc', 'prettier.config.js']; }
  getRequiredPackages() { return [{ name: 'prettier', dev: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    return false;
  }
}

export class BiomePlugin extends BasePlugin {
  get name() { return 'biome'; }
  getConfigFiles() { return ['biome.json']; }
  getRequiredPackages() { return [{ name: '@biomejs/biome', dev: true }]; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, 'biome.json')); return true; } catch { return false; }
  }
}

export class OxlintPlugin extends BasePlugin {
  get name() { return 'oxlint'; }
  getConfigFiles() { return ['oxlint.json']; }
  getRequiredPackages() { return [{ name: 'oxlint', dev: true }]; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, 'oxlint.json')); return true; } catch { return false; }
  }
}

export class HuskyPlugin extends BasePlugin {
  get name() { return 'husky'; }
  getConfigFiles() { return ['.husky/pre-commit']; }
  getRequiredPackages() { return [{ name: 'husky', dev: true }]; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, '.husky/pre-commit')); return true; } catch { return false; }
  }
}

export class LintStagedPlugin extends BasePlugin {
  get name() { return 'lint-staged'; }
  getConfigFiles() { return ['.lintstagedrc']; }
  getRequiredPackages() { return [{ name: 'lint-staged', dev: true }]; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, '.lintstagedrc')); return true; } catch { return false; }
  }
}

export class CommitlintPlugin extends BasePlugin {
  get name() { return 'commitlint'; }
  getConfigFiles() { return ['commitlint.config.js']; }
  getRequiredPackages() { return [{ name: '@commitlint/cli', dev: true }]; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, 'commitlint.config.js')); return true; } catch { return false; }
  }
}

export class ChangesetPlugin extends BasePlugin {
  get name() { return 'changeset'; }
  getConfigFiles() { return ['.changeset/config.json']; }
  getRequiredPackages() { return [{ name: '@changesets/cli', dev: true }]; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, '.changeset/config.json')); return true; } catch { return false; }
  }
}

export class BabelPlugin extends BasePlugin {
  get name() { return 'babel'; }
  getConfigFiles() { return ['.babelrc', 'babel.config.js']; }
  getRequiredPackages() { return [{ name: '@babel/core', dev: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    return false;
  }
}

export class SWCPlugin extends BasePlugin {
  get name() { return 'swc'; }
  getConfigFiles() { return ['.swcrc']; }
  getRequiredPackages() { return [{ name: '@swc/core', dev: true }]; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, '.swcrc')); return true; } catch { return false; }
  }
}

export class JestPlugin extends BasePlugin {
  get name() { return 'jest'; }
  getConfigFiles() { return ['jest.config.js']; }
  getRequiredPackages() { return [{ name: 'jest', dev: true }]; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, 'jest.config.js')); return true; } catch { return false; }
  }
  async analyze(node, filePath) {
    if (filePath.endsWith('jest.config.js')) {
      node.isEntry = true;
      if (node.rawCode?.includes('testEnvironment:')) node.hasJestTestEnv = true;
      if (node.rawCode?.includes('setupFiles:')) node.hasJestSetupFiles = true;
    }
  }
}

export class VitestPlugin extends BasePlugin {
  get name() { return 'vitest'; }
  getConfigFiles() { return ['vitest.config.ts', 'vitest.config.js']; }
  getRequiredPackages() { return [{ name: 'vitest', dev: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    return false;
  }
  detectEntryPoints(content, filePath) {
    if (this.getConfigFiles().some(f => filePath.endsWith(f))) {
      const parser = new FrameworkConfigParser(this.context);
      const { entries } = parser.parse(content, filePath);
      return Array.from(entries);
    }
    return [];
  }
  detectEntryPoints(content, filePath) {
    if (this.getConfigFiles().some(f => filePath.endsWith(f))) {
      const parser = new FrameworkConfigParser(this.context);
      const { entries } = parser.parse(content, filePath);
      return Array.from(entries);
    }
    return [];
  }
  async analyze(node, filePath) {
    if (this.getConfigFiles().some(f => filePath.endsWith(f))) {
      node.isEntry = true;
      if (node.rawCode) {
        const parser = new FrameworkConfigParser(this.context);
        const { aliases, entries } = parser.parse(node.rawCode, filePath);
        if (aliases.size > 0) {
          node.frameworkAliases = aliases;
          node.hasWebpackAliases = true;
        }
        if (entries.size > 0) {
          node.frameworkEntries = entries;
          node.hasWebpackEntries = true;
        }
      }
    }
  }
}

export class PlaywrightPlugin extends BasePlugin {
  get name() { return 'playwright'; }
  getConfigFiles() { return ['playwright.config.ts']; }
  getRequiredPackages() { return [{ name: '@playwright/test', dev: true }]; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, 'playwright.config.ts')); return true; } catch { return false; }
  }
}

export class CypressPlugin extends BasePlugin {
  get name() { return 'cypress'; }
  getConfigFiles() { return ['cypress.config.ts']; }
  getRequiredPackages() { return [{ name: 'cypress', dev: true }]; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, 'cypress.config.ts')); return true; } catch { return false; }
  }
}

export class StorybookPlugin extends BasePlugin {
  get name() { return 'storybook'; }
  getConfigFiles() { return ['.storybook/main.js']; }
  getRequiredPackages() { return [{ name: 'storybook', dev: true }]; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, '.storybook/main.js')); return true; } catch { return false; }
  }
}

export class MswPlugin extends BasePlugin {
  get name() { return 'msw'; }
  getRequiredPackages() { return [{ name: 'msw', dev: true }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.devDependencies?.msw);
    } catch { return false; }
  }
}

export class GithubActionsPlugin extends BasePlugin {
  get name() { return 'github-actions'; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, '.github/workflows')); return true; } catch { return false; }
  }
}

export class DockerPlugin extends BasePlugin {
  get name() { return 'docker'; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, 'Dockerfile')); return true; } catch { return false; }
  }
}

export class TerraformPlugin extends BasePlugin {
  get name() { return 'terraform'; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, 'main.tf')); return true; } catch { return false; }
  }
}

export class EditorConfigPlugin extends BasePlugin {
  get name() { return 'editorconfig'; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, '.editorconfig')); return true; } catch { return false; }
  }
}

export class NvmPlugin extends BasePlugin {
  get name() { return 'nvm'; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, '.nvmrc')); return true; } catch { return false; }
  }
}

export class VoltaPlugin extends BasePlugin {
  get name() { return 'volta'; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.volta);
    } catch { return false; }
  }
}

export class DotenvPlugin extends BasePlugin {
  get name() { return 'dotenv'; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, '.env')); return true; } catch { return false; }
  }
}

export class PnpmPlugin extends BasePlugin {
  get name() { return 'pnpm'; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, 'pnpm-lock.yaml')); return true; } catch { return false; }
  }
}

export class YarnPlugin extends BasePlugin {
  get name() { return 'yarn'; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, 'yarn.lock')); return true; } catch { return false; }
  }
}

export class BunPlugin extends BasePlugin {
  get name() { return 'bun'; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, 'bun.lockb')); return true; } catch { return false; }
  }
}

export class SwiperPlugin extends BasePlugin {
  get name() { return 'swiper'; }
  getRequiredPackages() { return [{ name: 'swiper', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.swiper);
    } catch { return false; }
  }
}

export class QuillPlugin extends BasePlugin {
  get name() { return 'quill'; }
  getRequiredPackages() { return [{ name: 'quill', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.quill);
    } catch { return false; }
  }
}

export class EnvelopPlugin extends BasePlugin {
  get name() { return 'envelop'; }
  getRequiredPackages() { return [{ name: '@envelop/core', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['@envelop/core']);
    } catch { return false; }
  }
}

export class HonoPlugin extends BasePlugin {
  get name() { return 'hono'; }
  getRequiredPackages() { return [{ name: 'hono', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.hono);
    } catch { return false; }
  }
}

export class ExpressPlugin extends BasePlugin {
  get name() { return 'express'; }
  getRequiredPackages() { return [{ name: 'express', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.express);
    } catch { return false; }
  }
}

export class FastifyPlugin extends BasePlugin {
  get name() { return 'fastify'; }
  getRequiredPackages() { return [{ name: 'fastify', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.fastify);
    } catch { return false; }
  }
}

export class NestJsPlugin extends BasePlugin {
  get name() { return 'nestjs'; }
  getRequiredPackages() { return [{ name: '@nestjs/core', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['@nestjs/core']);
    } catch { return false; }
  }
}

export class KoaPlugin extends BasePlugin {
  get name() { return 'koa'; }
  getRequiredPackages() { return [{ name: 'koa', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.koa);
    } catch { return false; }
  }
}

export class ElysiaPlugin extends BasePlugin {
  get name() { return 'elysia'; }
  getRequiredPackages() { return [{ name: 'elysia', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.elysia);
    } catch { return false; }
  }
}

export class SocketIoPlugin extends BasePlugin {
  get name() { return 'socket.io'; }
  getRequiredPackages() { return [{ name: 'socket.io', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['socket.io']);
    } catch { return false; }
  }
}

export class TypeScriptPlugin extends BasePlugin {
  get name() { return 'typescript'; }
  getConfigFiles() { return ['tsconfig.json', 'global.d.ts']; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, 'tsconfig.json')); return true; } catch { return false; }
  }
}

export class GrammyPlugin extends BasePlugin {
  get name() { return 'grammy'; }
  getRequiredPackages() { return [{ name: 'grammy', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.grammy);
    } catch { return false; }
  }
}

export class HapiPlugin extends BasePlugin {
  get name() { return 'hapi'; }
  getRequiredPackages() { return [{ name: '@hapi/hapi', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['@hapi/hapi']);
    } catch { return false; }
  }
}

export class RTLCSSPlugin extends BasePlugin {
  get name() { return 'rtlcss'; }
  getConfigFiles() { return ['rtlcss.config.js']; }
  getRequiredPackages() { return [{ name: 'rtlcss', dev: true }]; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, 'rtlcss.config.js')); return true; } catch { return false; }
  }
}

export class CKEditorEnginePlugin extends BasePlugin {
  get name() { return 'ckeditor5-engine'; }
  getRequiredPackages() { return [{ name: '@ckeditor/ckeditor5-engine', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['@ckeditor/ckeditor5-engine']);
    } catch { return false; }
  }
}

export class NitroModulesPlugin extends BasePlugin {
  get name() { return 'nitro-modules'; }
  getRequiredPackages() { return [{ name: 'react-native-nitro-modules', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['react-native-nitro-modules']);
    } catch { return false; }
  }
}

/**
 * ============================================================================
 * Aggregated Exports
 * ============================================================================
 * Use these to import all plugins at once.
 */

// ─── UI LIBRARIES ──────────────────────────────────────────────────────────

export class AntdPlugin extends BasePlugin {
  get name() { return 'antd'; }
  getRequiredPackages() { return [{ name: 'antd', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.antd || pkgJson.devDependencies?.antd);
    } catch { return false; }
  }
}

export class MuiPlugin extends BasePlugin {
  get name() { return 'mui'; }
  getRequiredPackages() { return [{ name: '@mui/material', dev: false }, { name: '@emotion/react', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['@mui/material'] || pkgJson.devDependencies?.['@mui/material']);
    } catch { return false; }
  }
}

export class ShadcnPlugin extends BasePlugin {
  get name() { return 'shadcn'; }
  getConfigFiles() { return ['components.json']; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, 'components.json')); return true; } catch { return false; }
  }
}

export class RadixUIPlugin extends BasePlugin {
  get name() { return 'radix-ui'; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      const allDeps = { ...(pkgJson.dependencies || {}), ...(pkgJson.devDependencies || {}) };
      return Object.keys(allDeps).some(k => k.startsWith('@radix-ui/'));
    } catch { return false; }
  }
}

export class ChakraUIPlugin extends BasePlugin {
  get name() { return 'chakra-ui'; }
  getRequiredPackages() { return [{ name: '@chakra-ui/react', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['@chakra-ui/react'] || pkgJson.devDependencies?.['@chakra-ui/react']);
    } catch { return false; }
  }
}

// ─── ANIMATION ───────────────────────────────────────────────────────────────

export class FramerMotionPlugin extends BasePlugin {
  get name() { return 'framer-motion'; }
  getRequiredPackages() { return [{ name: 'framer-motion', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['framer-motion'] || pkgJson.devDependencies?.['framer-motion']);
    } catch { return false; }
  }
}

export class GSAPPlugin extends BasePlugin {
  get name() { return 'gsap'; }
  getRequiredPackages() { return [{ name: 'gsap', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.gsap || pkgJson.devDependencies?.gsap);
    } catch { return false; }
  }
}

// ─── VALIDATION ──────────────────────────────────────────────────────────────

export class ZodPlugin extends BasePlugin {
  get name() { return 'zod'; }
  getRequiredPackages() { return [{ name: 'zod', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.zod || pkgJson.devDependencies?.zod);
    } catch { return false; }
  }
}

export class YupPlugin extends BasePlugin {
  get name() { return 'yup'; }
  getRequiredPackages() { return [{ name: 'yup', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.yup || pkgJson.devDependencies?.yup);
    } catch { return false; }
  }
}

export class ValibotPlugin extends BasePlugin {
  get name() { return 'valibot'; }
  getRequiredPackages() { return [{ name: 'valibot', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.valibot || pkgJson.devDependencies?.valibot);
    } catch { return false; }
  }
}

// ─── I18N ───────────────────────────────────────────────────────────────────

export class I18nextPlugin extends BasePlugin {
  get name() { return 'i18next'; }
  getRequiredPackages() { return [{ name: 'i18next', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.i18next || pkgJson.devDependencies?.i18next);
    } catch { return false; }
  }
}

export class VueI18nPlugin extends BasePlugin {
  get name() { return 'vue-i18n'; }
  getRequiredPackages() { return [{ name: 'vue-i18n', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['vue-i18n'] || pkgJson.devDependencies?.['vue-i18n']);
    } catch { return false; }
  }
}

// ─── MONITORING ─────────────────────────────────────────────────────────────

export class SentryPlugin extends BasePlugin {
  get name() { return 'sentry'; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      const allDeps = { ...(pkgJson.dependencies || {}), ...(pkgJson.devDependencies || {}) };
      return Object.keys(allDeps).some(k => k.startsWith('@sentry/'));
    } catch { return false; }
  }
}

export class OpenTelemetryPlugin extends BasePlugin {
  get name() { return 'opentelemetry'; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      const allDeps = { ...(pkgJson.dependencies || {}), ...(pkgJson.devDependencies || {}) };
      return Object.keys(allDeps).some(k => k.startsWith('@opentelemetry/'));
    } catch { return false; }
  }
}


/**
 * ============================================================================
 * Aggregated Exports
 * ============================================================================
 * Use these to import all plugins at once.
 */

export const AllPluginClasses = [
  GraphQLPlugin, ApolloPlugin, DatabasePlugin, PrismaPlugin, DrizzlePlugin, 
  MongoosePlugin, SupabasePlugin, FirebasePlugin, ClerkPlugin, TRPCPlugin, 
  NuxtPlugin, RemixPlugin, SvelteKitPlugin, AstroPlugin, VitepressPlugin, 
  GatsbyPlugin, RedwoodPlugin, NextJsPlugin, ReactPlugin, VuePlugin, 
  SveltePlugin, AngularPlugin, PreactPlugin, SolidPlugin, QwikPlugin, 
  LitPlugin, VitePlugin, EsbuildPlugin, RollupPlugin, WebpackPlugin, 
  ParcelPlugin, TurboPlugin, NxPlugin, TailwindPlugin, PostcssPlugin, 
  UnoCSSPlugin, StylelintPlugin, EslintPlugin, PrettierPlugin, BiomePlugin, 
  OxlintPlugin, HuskyPlugin, LintStagedPlugin, CommitlintPlugin, ChangesetPlugin, 
  BabelPlugin, SWCPlugin, JestPlugin, VitestPlugin, PlaywrightPlugin, 
  CypressPlugin, StorybookPlugin, MswPlugin, GithubActionsPlugin, DockerPlugin, 
  TerraformPlugin, EditorConfigPlugin, NvmPlugin, VoltaPlugin, DotenvPlugin, 
  PnpmPlugin, YarnPlugin, BunPlugin, SwiperPlugin, QuillPlugin, EnvelopPlugin, 
  HonoPlugin, ExpressPlugin, FastifyPlugin, NestJsPlugin, KoaPlugin, 
  ElysiaPlugin, SocketIoPlugin, TypeScriptPlugin, GrammyPlugin, HapiPlugin, 
  RTLCSSPlugin, CKEditorEnginePlugin, NitroModulesPlugin, AntdPlugin, MuiPlugin, 
  ShadcnPlugin, RadixUIPlugin, ChakraUIPlugin, FramerMotionPlugin, GSAPPlugin, 
  ZodPlugin, YupPlugin, ValibotPlugin, I18nextPlugin, VueI18nPlugin, 
  SentryPlugin, OpenTelemetryPlugin
];

export const Plugins = {
  GraphQLPlugin, ApolloPlugin, DatabasePlugin, PrismaPlugin, DrizzlePlugin, 
  MongoosePlugin, SupabasePlugin, FirebasePlugin, ClerkPlugin, TRPCPlugin, 
  NuxtPlugin, RemixPlugin, SvelteKitPlugin, AstroPlugin, VitepressPlugin, 
  GatsbyPlugin, RedwoodPlugin, NextJsPlugin, ReactPlugin, VuePlugin, 
  SveltePlugin, AngularPlugin, PreactPlugin, SolidPlugin, QwikPlugin, 
  LitPlugin, VitePlugin, EsbuildPlugin, RollupPlugin, WebpackPlugin, 
  ParcelPlugin, TurboPlugin, NxPlugin, TailwindPlugin, PostcssPlugin, 
  UnoCSSPlugin, StylelintPlugin, EslintPlugin, PrettierPlugin, BiomePlugin, 
  OxlintPlugin, HuskyPlugin, LintStagedPlugin, CommitlintPlugin, ChangesetPlugin, 
  BabelPlugin, SWCPlugin, JestPlugin, VitestPlugin, PlaywrightPlugin, 
  CypressPlugin, StorybookPlugin, MswPlugin, GithubActionsPlugin, DockerPlugin, 
  TerraformPlugin, EditorConfigPlugin, NvmPlugin, VoltaPlugin, DotenvPlugin, 
  PnpmPlugin, YarnPlugin, BunPlugin, SwiperPlugin, QuillPlugin, EnvelopPlugin, 
  HonoPlugin, ExpressPlugin, FastifyPlugin, NestJsPlugin, KoaPlugin, 
  ElysiaPlugin, SocketIoPlugin, TypeScriptPlugin, GrammyPlugin, HapiPlugin, 
  RTLCSSPlugin, CKEditorEnginePlugin, NitroModulesPlugin, AntdPlugin, MuiPlugin, 
  ShadcnPlugin, RadixUIPlugin, ChakraUIPlugin, FramerMotionPlugin, GSAPPlugin, 
  ZodPlugin, YupPlugin, ValibotPlugin, I18nextPlugin, VueI18nPlugin, 
  SentryPlugin, OpenTelemetryPlugin
};
