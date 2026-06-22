import fs from 'fs/promises';
import path from 'path';

/**
 * ConfigLoader
 *
 * Loads and merges entkapp configuration from multiple sources.
 * Supports Monorepo detection for pnpm, npm/yarn/bun, Lerna, Turbo, and Nx.
 */
export class ConfigLoader {
  constructor(cwd) {
    this.cwd = cwd;
  }

  async loadConfig(overrides = {}) {
    let config = this._defaultConfig();

    // 1. entkapp/config.json
    const jsonConfigPath = path.join(this.cwd, 'entkapp', 'config.json');
    try {
      const raw = await fs.readFile(jsonConfigPath, 'utf8');
      const stripped = raw.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      config = this._merge(config, JSON.parse(stripped));
    } catch (e) {}

    // 2. entkapp.config.ts / .mjs / .js / .cjs
    for (const configFile of ['entkapp.config.ts', 'entkapp.config.mjs', 'entkapp.config.js', 'entkapp.config.cjs']) {
      const jsConfigPath = path.join(this.cwd, configFile);
      try {
        const mod = await import(jsConfigPath);
        const jsConfig = mod.default || mod;
        if (typeof jsConfig === 'object' && jsConfig !== null) {
          config = this._merge(config, jsConfig);
          break;
        }
      } catch (e) {}
    }

    // 3. package.json "entkapp" key
    try {
      const pkg = JSON.parse(await fs.readFile(path.join(this.cwd, 'package.json'), 'utf8'));
      if (pkg.entkapp && typeof pkg.entkapp === 'object') {
        config = this._merge(config, pkg.entkapp);
      }
    } catch (e) {}

    // 4. Workspace / monorepo packages
    const workspaceData = await this.loadWorkspaceConfigs();
    if (workspaceData.packages.length > 0) {
      config.workspace = true;
      config.workspacePackages = workspaceData.packages;
      config.workspaceTsConfigs = workspaceData.tsConfigs;
      config.workspaceConfigFiles = workspaceData.configFiles;
      config.monorepoConfigs = workspaceData.monorepoConfigs;
    }

    // 5. CLI overrides
    config = this._merge(config, overrides);

    // Final sanity check: ensure arrays exist
    if (!Array.isArray(config.entryPoints)) config.entryPoints = [];
    if (!Array.isArray(config.workspacePackages)) config.workspacePackages = [];
    if (!Array.isArray(config.workspaceTsConfigs)) config.workspaceTsConfigs = [];
    if (!Array.isArray(config.workspaceConfigFiles)) config.workspaceConfigFiles = [];

    return config;
  }

  async loadWorkspaceConfigs() {
    const result = {
      packages: [],
      tsConfigs: [],
      configFiles: [],
      monorepoConfigs: {}
    };

    // Load global configs first
    const globalConfigs = ['turbo.json', 'nx.json', 'lerna.json'];
    for (const file of globalConfigs) {
      try {
        const content = JSON.parse(await fs.readFile(path.join(this.cwd, file), 'utf8'));
        result.monorepoConfigs[file] = content;
      } catch (e) {}
    }

    const patterns = await this._resolveWorkspacePatterns();
    if (patterns.length === 0) return result;

    for (const pattern of patterns) {
      const dirs = await this._expandGlob(pattern);
      for (const dir of dirs) {
        await this._readPackageDir(dir, result);
      }
    }

    return result;
  }

  async _resolveWorkspacePatterns() {
    const pnpmPatterns = await this._parseWorkspaceYaml('pnpm-workspace.yaml');
    if (pnpmPatterns.length > 0) return pnpmPatterns;

    try {
      const pkg = JSON.parse(await fs.readFile(path.join(this.cwd, 'package.json'), 'utf8'));
      if (pkg.workspaces) {
        return Array.isArray(pkg.workspaces) ? pkg.workspaces : pkg.workspaces.packages || [];
      }
    } catch (e) {}

    try {
      const lerna = JSON.parse(await fs.readFile(path.join(this.cwd, 'lerna.json'), 'utf8'));
      if (lerna.packages) return lerna.packages;
    } catch (e) {}

    return this._parseWorkspaceYaml('workspace.yaml');
  }

  async _parseWorkspaceYaml(fileName) {
    const filePath = path.join(this.cwd, fileName);
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      const patterns = [];
      const lines = raw.split('\n');
      let inPackages = false;
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        if (/^packages\s*:/.test(trimmed)) {
          inPackages = true;
          const inlineMatch = trimmed.match(/^packages\s*:\s*\[([^\]]*)\]/);
          if (inlineMatch) {
            inPackages = false;
            for (const item of inlineMatch[1].split(',')) {
              const val = item.trim().replace(/^['"]|['"]$/g, '');
              if (val) patterns.push(val);
            }
          }
          continue;
        }
        if (inPackages) {
          if (line.match(/^[a-zA-Z0-9_-]/) && trimmed.endsWith(':')) {
            inPackages = false;
            continue;
          }
          if (trimmed.startsWith('-')) {
            const val = trimmed.substring(1).trim().replace(/^['"]|['"]$/g, '');
            if (val) patterns.push(val);
          }
        }
      }
      return patterns;
    } catch (e) {
      return [];
    }
  }

  async _readPackageDir(dir, result) {
    const normalizedDir = dir.replace(/\\/g, '/');
    let packageName;

    try {
      const pkg = JSON.parse(await fs.readFile(path.join(dir, 'package.json'), 'utf8'));
      packageName = pkg.name;
      result.packages.push({
        dir: normalizedDir,
        name: packageName,
        entkappConfig: (pkg.entkapp && typeof pkg.entkapp === 'object') ? pkg.entkapp : {}
      });
    } catch (e) {
      // If no package.json, skip as requested in WorkSpaceGraph logic
      return;
    }

    // tsconfig.json
    try {
      const tsconfigRaw = await fs.readFile(path.join(dir, 'tsconfig.json'), 'utf8');
      const stripped = tsconfigRaw.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      result.tsConfigs.push({ dir: normalizedDir, name: packageName, tsconfig: JSON.parse(stripped) });
    } catch (e) {}

    // *.config.ts / .js
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile() || !/\.config\.(ts|js|mjs|cjs)$/.test(entry.name)) continue;
        const filePath = path.join(dir, entry.name).replace(/\\/g, '/');
        try {
          const content = await fs.readFile(filePath, 'utf8');
          result.configFiles.push({ dir: normalizedDir, name: packageName, fileName: entry.name, filePath, content });
        } catch (e) {}
      }
    } catch (e) {}
  }

  async _expandGlob(pattern) {
    const results = [];
    const cleanPattern = pattern.replace(/\/$/, '');
    if (cleanPattern.includes('*')) {
      const parts = cleanPattern.split('/');
      const wildcardIndex = parts.findIndex(p => p.includes('*'));
      const baseDir = path.join(this.cwd, ...parts.slice(0, wildcardIndex));
      try {
        const entries = await fs.readdir(baseDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            const fullPath = path.join(baseDir, entry.name);
            try {
              await fs.access(path.join(fullPath, 'package.json'));
              results.push(fullPath.replace(/\\/g, '/'));
            } catch (e) {}
          }
        }
      } catch (e) {}
    } else {
      const fullPath = path.resolve(this.cwd, cleanPattern);
      try {
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) results.push(fullPath.replace(/\\/g, '/'));
      } catch (e) {}
    }
    return results;
  }

  _defaultConfig() {
    return {
      interface: 'CLI',
      useBuiltinPlugins: true,
      useCustomPlugins: true,
      options: { verbose: false, fastMode: true, selfHealing: true },
      enabledPlugins: [],
      ignoreDependencies: ['entkapp', '@types/*'],
      exclude: ['node_modules', '.git', 'dist', 'build', 'coverage'],
      entryPoints: [],
      workspace: false,
      workspacePackages: [],
      workspaceTsConfigs: [],
      workspaceConfigFiles: [],
      monorepoConfigs: {}
    };
  }

  _merge(base, override) {
    if (!override || typeof override !== 'object') return base;
    const result = { ...base };
    for (const key of Object.keys(override)) {
      if (key === 'options' && typeof override[key] === 'object') {
        result.options = { ...(base.options || {}), ...override[key] };
      } else {
        result[key] = override[key];
      }
    }
    return result;
  }
}
