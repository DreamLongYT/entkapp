/**
 * ============================================================================
 * Backend Services Plugins for entkapp v5.0.0
 * ============================================================================
 * Built-in support for GraphQL, REST APIs, Databases, and BaaS providers.
 * v5.0.0: All plugins implement getRequiredPackages() for dependency detection.
 */
import { BasePlugin } from '../BasePlugin.mjs';
import fs from 'fs/promises';
import path from 'path';

export class GraphQLPlugin extends BasePlugin {
  get name() { return 'graphql'; }
  getConfigFiles() { return ['package.json', 'graphql.config.mjs', 'graphql.config.ts', '.graphqlconfig', 'graphql.config.yml']; }
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
  getConfigFiles() { return ['package.json', 'apollo.config.mjs', 'apollo.config.ts']; }
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
  getConfigFiles() { return ['package.json', 'prisma/schema.prisma', 'drizzle.config.ts', 'drizzle.config.mjs', 'ormconfig.json']; }
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
  getConfigFiles() { return ['drizzle.config.ts', 'drizzle.config.mjs', 'drizzle.config.mjs']; }
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
