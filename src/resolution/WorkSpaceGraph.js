import fs from 'fs/promises';
import path from 'path';

/**
 * WorkspaceGraph
 *
 * Discovers and maps all packages in a monorepo/workspace setup.
 * Supported workspace manifests (in priority order):
 *   1. pnpm-workspace.yaml              (pnpm)
 *   2. package.json "workspaces" field  (npm / yarn / bun)
 *   3. lerna.json                       (Lerna)
 *   4. workspace.yaml                   (generic / custom toolchains)
 */
export class WorkspaceGraph {
  constructor(context) {
    this.context = context;

    /** @type {Map<string, Object>} dirPath -> manifest data */
    this.packageManifests = new Map();

    /** @type {Map<string, string>} packageName -> dirPath */
    this.workspacePackages = new Map();

    /** @type {Map<string, Object>} packageName -> parsed tsconfig data */
    this.tsconfigPaths = new Map();

    /**
     * Per-package framework / tool config files.
     * @type {Map<string, Array<{fileName: string, filePath: string, content: string}>>}
     */
    this.packageConfigFiles = new Map();

    /**
     * Global pipeline / monorepo configs (turbo.json, nx.json, etc.)
     * @type {Map<string, Object>} fileName -> parsed content
     */
    this.monorepoConfigs = new Map();
  }

  async initializeWorkspaceMesh() {
    let workspaces = [];

    // 1. pnpm-workspace.yaml
    workspaces = await this._parseWorkspaceYaml('pnpm-workspace.yaml');

    // 2. package.json "workspaces"
    if (workspaces.length === 0) {
      try {
        const rootPkgPath = path.join(this.context.cwd, 'package.json');
        const rootPkg = JSON.parse(await fs.readFile(rootPkgPath, 'utf8'));
        if (rootPkg.workspaces) {
          workspaces = Array.isArray(rootPkg.workspaces)
            ? rootPkg.workspaces
            : rootPkg.workspaces.packages || [];
        }
      } catch (e) {}
    }

    // 3. lerna.json
    if (workspaces.length === 0) {
      try {
        const lernaPath = path.join(this.context.cwd, 'lerna.json');
        const lerna = JSON.parse(await fs.readFile(lernaPath, 'utf8'));
        workspaces = lerna.packages || [];
      } catch (e) {}
    }

    // 4. workspace.yaml
    if (workspaces.length === 0) {
      workspaces = await this._parseWorkspaceYaml('workspace.yaml');
    }

    await this._loadGlobalMonorepoConfigs();

    if (workspaces.length === 0) return;

    this.context.isWorkspaceEnabled = true;
    if (this.context.verbose) {
      console.log('[Workspace] Detected workspace patterns:', workspaces);
    }

    for (const pattern of workspaces) {
      const matches = await this._expandGlob(pattern, this.context.cwd);
      for (const matchDir of matches) {
        await this._loadPackageDir(matchDir);
      }
    }
  }

  async _loadGlobalMonorepoConfigs() {
    const configFiles = ['turbo.json', 'nx.json'];
    for (const file of configFiles) {
      try {
        const filePath = path.join(this.context.cwd, file);
        const content = JSON.parse(await fs.readFile(filePath, 'utf8'));
        this.monorepoConfigs.set(file, content);
      } catch (e) {}
    }
  }

  async _parseWorkspaceYaml(fileName) {
    const yamlPath = path.join(this.context.cwd, fileName);
    try {
      const raw = await fs.readFile(yamlPath, 'utf8');
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

  async _loadPackageDir(matchDir) {
    const normalizedDir = matchDir.replace(/\\/g, '/');
    const pkgPath = path.join(matchDir, 'package.json');
    let pkgData = null;

    try {
      pkgData = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
    } catch (e) {
      // UPGRADE: If no package.json, it's not a package – skip silently
      return;
    }

    const packageName = pkgData.name || path.basename(matchDir);

    this.packageManifests.set(normalizedDir, {
      rootDirectory: normalizedDir,
      manifestPath: pkgPath.replace(/\\/g, '/'),
      name: packageName,
      version: pkgData.version,
      dependencies: pkgData.dependencies || {},
      devDependencies: pkgData.devDependencies || {},
      peerDependencies: pkgData.peerDependencies || {},
      scripts: pkgData.scripts || {},
      entryPoints: await this.calculatePackageExportsEntries(pkgData, normalizedDir)
    });

    this.workspacePackages.set(packageName, normalizedDir);
    this.context.monorepoPackageRoots.add(normalizedDir);

    // tsconfig.json
    const tsconfigPath = path.join(matchDir, 'tsconfig.json');
    try {
      const tsconfigRaw = await fs.readFile(tsconfigPath, 'utf8');
      const stripped = tsconfigRaw.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      const tsconfigData = JSON.parse(stripped);
      this.tsconfigPaths.set(packageName, tsconfigData);
      this.tsconfigPaths.set(normalizedDir, tsconfigData);
    } catch (e) {}

    await this._loadPackageConfigFiles(matchDir, normalizedDir, packageName);
  }

  async _loadPackageConfigFiles(packageDir, normalizedDir, packageName) {
    const configEntries = [];
    let dirEntries;
    try {
      dirEntries = await fs.readdir(packageDir, { withFileTypes: true });
    } catch (e) { return; }

    for (const entry of dirEntries) {
      if (!entry.isFile()) continue;
      const isConfig = /\.config\.(ts|js|mjs|cjs)$/.test(entry.name);
      const isJson = entry.name === 'package.json' || entry.name === 'tsconfig.json';
      
      if (!isConfig && !isJson) continue;

      const filePath = path.join(packageDir, entry.name).replace(/\\/g, '/');
      try {
        const content = await fs.readFile(filePath, 'utf8');
        configEntries.push({ fileName: entry.name, filePath, content });
      } catch (e) {}
    }
    if (configEntries.length > 0) this.packageConfigFiles.set(normalizedDir, configEntries);
  }

  async calculatePackageExportsEntries(pkgData, dirPath) {
    const entries = [];
    const addEntry = (p) => {
      if (typeof p === 'string') entries.push(path.resolve(dirPath, p).replace(/\\/g, '/'));
    };

    if (pkgData.main) addEntry(pkgData.main);
    if (pkgData.module) addEntry(pkgData.module);
    if (pkgData.source) addEntry(pkgData.source);
    if (pkgData.types) addEntry(pkgData.types);
    if (pkgData.typings) addEntry(pkgData.typings);
    
    if (pkgData.bin) {
      if (typeof pkgData.bin === 'string') addEntry(pkgData.bin);
      else Object.values(pkgData.bin).forEach(addEntry);
    }

    if (pkgData.exports) {
      const traverseExports = (obj) => {
        if (typeof obj === 'string') addEntry(obj);
        else if (typeof obj === 'object' && obj !== null) {
          for (const key in obj) traverseExports(obj[key]);
        }
      };
      traverseExports(pkgData.exports);
    }

    // UPGRADE: If no explicit entry points found, look for standard index files (poly-extension)
    if (entries.length === 0) {
      const standardIndexFiles = ['index.js', 'index.ts', 'index.jsx', 'index.tsx', 'index.mjs', 'index.cjs'];
      for (const fileName of standardIndexFiles) {
        const fullPath = path.join(dirPath, fileName);
        try {
          await fs.access(fullPath);
          addEntry(fileName);
          break; // Take the first one found
        } catch {}
      }
    }

    return entries;
  }

  isLocalWorkspaceSpecifier(specifier) {
    if (!specifier) return false;
    if (this.workspacePackages.has(specifier)) return true;
    for (const pkgName of this.workspacePackages.keys()) {
      if (specifier.startsWith(pkgName + '/')) return true;
    }
    return false;
  }

  getWorkspacePackageMatch(specifier) {
    if (this.workspacePackages.has(specifier)) {
      const dir = this.workspacePackages.get(specifier);
      return this.packageManifests.get(dir);
    }
    for (const pkgName of this.workspacePackages.keys()) {
      if (specifier.startsWith(pkgName + '/')) {
        const dir = this.workspacePackages.get(pkgName);
        return this.packageManifests.get(dir);
      }
    }
    return null;
  }

  markWorkspacePackagesAsUsed() {
    for (const [pkgName] of this.workspacePackages.entries()) {
      this.context.usedExternalPackages.add(pkgName);
    }
  }

  async findFrameworkConfigs() {
    const configFiles = new Set();
    await this._scanDirForConfigs(this.context.cwd, configFiles);
    for (const [dir, entries] of this.packageConfigFiles.entries()) {
      for (const { fileName, filePath } of entries) {
        if (/\.config\.(ts|js|mjs|cjs)$/.test(fileName)) configFiles.add(filePath);
      }
    }
    for (const root of this.context.monorepoPackageRoots) {
      const normalizedRoot = root.replace(/\\/g, '/');
      if (!this.packageConfigFiles.has(normalizedRoot)) await this._scanDirForConfigs(root, configFiles);
    }
    return Array.from(configFiles);
  }

  async _scanDirForConfigs(dir, configFiles) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.includes('.config.') && /\.(ts|js|mjs|cjs)$/.test(entry.name)) {
          configFiles.add(path.join(dir, entry.name).replace(/\\/g, '/'));
        }
      }
    } catch (e) {}
  }

  getPackageConfigFiles(dirOrName) {
    const normalized = dirOrName.replace(/\\/g, '/');
    if (this.packageConfigFiles.has(normalized)) return this.packageConfigFiles.get(normalized);
    const dir = this.workspacePackages.get(dirOrName);
    if (dir) return this.packageConfigFiles.get(dir) || [];
    return [];
  }

  getPackageTsConfig(dirOrName) {
    const normalized = dirOrName.replace(/\\/g, '/');
    if (this.tsconfigPaths.has(normalized)) return this.tsconfigPaths.get(normalized);
    const dir = this.workspacePackages.get(dirOrName);
    if (dir) return this.tsconfigPaths.get(dir);
    return undefined;
  }

  getSummary() {
    return {
      packages: this.packageManifests.size,
      tsconfigsLoaded: this.tsconfigPaths.size,
      configFilesLoaded: Array.from(this.packageConfigFiles.values()).reduce((sum, arr) => sum + arr.length, 0),
      monorepoConfigs: Array.from(this.monorepoConfigs.keys()),
      packageNames: Array.from(this.workspacePackages.keys())
    };
  }

  async _expandGlob(pattern, cwd) {
    const results = [];
    const cleanPattern = pattern.replace(/\/$/, '');
    if (cleanPattern.includes('*')) {
      const parts = cleanPattern.split('/');
      const wildcardIndex = parts.findIndex(p => p.includes('*'));
      const baseDir = path.join(cwd, ...parts.slice(0, wildcardIndex));
      try {
        const entries = await fs.readdir(baseDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            const fullPath = path.join(baseDir, entry.name);
            results.push(fullPath.replace(/\\/g, '/'));
          }
        }
      } catch (e) {}
    } else {
      const fullPath = path.resolve(cwd, cleanPattern);
      try {
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) results.push(fullPath.replace(/\\/g, '/'));
      } catch (e) {}
    }
    return results;
  }
}
