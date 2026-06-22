import fs from 'fs';
import path from 'path';
import { TSConfigLoader } from './TSConfigLoader.js';

export class PathMapper {
  constructor(context) { 
    this.context = context; 
    this.aliasMappers = []; // list of alias mapping functions
    // UPGRADE: Raw alias patterns for fast "is this an alias?" checks without file-existence tests
    this._aliasPatterns = []; // Array of { regex }
  }
  
  async loadMappings(tsconfigFilename = 'tsconfig.json') {
    // UPGRADE: Reset on reload to avoid duplicate entries when called twice (workspace re-load)
    this.aliasMappers = [];
    this._aliasPatterns = [];

    // Load root tsconfig
    const loader = new TSConfigLoader(this.context.cwd);
    const config = loader.load();
    if (config) {
      const mapper = loader.getAliasMapper(config);
      this.aliasMappers.push(mapper);
      this._collectAliasPatterns(config, loader);
      if (this.context.verbose) console.log(`[PathMapper] Loaded root tsconfig aliases`);
    }

    // Load workspace tsconfigs if available
    if (this.context.isWorkspaceEnabled && this.context.monorepoPackageRoots) {
      for (const root of this.context.monorepoPackageRoots) {
        const wsLoader = new TSConfigLoader(root);
        const wsConfig = wsLoader.load();
        if (wsConfig) {
          const wsMapper = wsLoader.getAliasMapper(wsConfig);
          this.aliasMappers.push(wsMapper);
          this._collectAliasPatterns(wsConfig, wsLoader);
          if (this.context.verbose) console.log(`[PathMapper] Loaded workspace tsconfig aliases from ${root}`);
        }
      }
    }
  }

  /**
   * UPGRADE: Collect raw alias patterns from a parsed tsconfig so we can answer
   * "is this specifier a tsconfig alias?" without needing the target file to exist on disk.
   * Handles patterns like "@shared/*", "@idk/*", "~/*", etc.
   * @param {Object} parsedConfig - Result of TSConfigLoader.load()
   * @param {TSConfigLoader} loader
   */
  _collectAliasPatterns(parsedConfig, loader) {
    if (!parsedConfig || !parsedConfig.options) return;
    const { paths, baseUrl } = parsedConfig.options;

    if (paths) {
      for (const pattern in paths) {
        // Convert tsconfig glob pattern to a regex
        // e.g. "@shared/*" -> /^@shared\//  or  "@shared" -> /^@shared$/
        const escaped = pattern
          .replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape regex special chars except *
          .replace(/\\\*/g, '.*');               // replace escaped \* with .*
        try {
          this._aliasPatterns.push({ regex: new RegExp('^' + escaped + '$') });
          // Also add a prefix variant so "@shared/foo/bar" matches "@shared/*"
          const prefixEscaped = pattern.replace(/\*.*$/, '').replace(/[.+^${}()|[\]\\]/g, '\\$&');
          if (prefixEscaped && prefixEscaped !== escaped) {
            this._aliasPatterns.push({ regex: new RegExp('^' + prefixEscaped) });
          }
        } catch (e) { /* ignore invalid regex */ }
      }
    }
  }

  /**
   * UPGRADE: Returns true if the given specifier matches any tsconfig path alias pattern.
   * This check does NOT require the target file to exist on disk.
   * Used by the unlisted-dependency audit to skip tsconfig-aliased imports.
   * @param {string} specifier
   * @returns {boolean}
   */
  isTsconfigAlias(specifier) {
    if (!specifier || typeof specifier !== 'string') return false;
    for (const { regex } of this._aliasPatterns) {
      if (regex.test(specifier)) return true;
    }
    return false;
  }

  /**
   * UPGRADE: Manually register a dynamic alias (e.g. from vite.config.js).
   * @param {string} key - Alias key (e.g. "@shared")
   * @param {string} target - Absolute path or relative path to resolve
   */
  addAlias(key, target) {
    if (!key || !target) return;
    
    // 1. Add to aliasMappers for resolvePath()
    const mapper = (p) => {
      if (p === key) return target;
      if (p.startsWith(key + '/')) {
        return path.join(target, p.substring(key.length + 1)).replace(/\\/g, '/');
      }
      return p;
    };
    this.aliasMappers.push(mapper);

    // 2. Add to _aliasPatterns for isTsconfigAlias() checks
    const escaped = key.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    try {
      this._aliasPatterns.push({ regex: new RegExp('^' + escaped + '$') });
      this._aliasPatterns.push({ regex: new RegExp('^' + escaped + '/') });
    } catch (e) {}
    
    if (this.context.verbose) console.log(`[PathMapper] Added dynamic alias: ${key} -> ${target}`);
  }

  /**
   * Resolves physical module paths on disk, translating modern .js imports 
   * back to their actual TypeScript source files.
   * @param {string} p - The target module specifier or absolute path
   */
  resolvePath(p) {
    if (!p || typeof p !== 'string') return p;

    let resolvedP = p;

    // Try alias mappers first
    for (const mapper of this.aliasMappers) {
      const mapped = mapper(resolvedP);
      if (mapped !== resolvedP && fs.existsSync(mapped)) {
        resolvedP = mapped;
        break;
      }
    }

    // FIX 1: If the import ends with .js, translate it to .ts for the search
    if (resolvedP.endsWith('.js')) {
      const tsPath = resolvedP.slice(0, -3) + '.ts';
      if (fs.existsSync(tsPath)) return tsPath;
    }

    // FIX 2: If the import ends with .jsx, translate it to .tsx for the search
    if (resolvedP.endsWith('.jsx')) {
      const tsxPath = resolvedP.slice(0, -4) + '.tsx';
      if (fs.existsSync(tsxPath)) return tsxPath;
    }

    // FIX 3: Support for directory imports (z.B. ./adapters -> ./adapters/index.ts)
    try {
      const stat = fs.statSync(resolvedP);
      if (stat.isDirectory()) {
        const extensions = ['.ts', '.tsx', '.js', '.jsx'];
        for (const ext of extensions) {
          const indexPath = path.join(resolvedP, `index${ext}`);
          if (fs.existsSync(indexPath)) return indexPath;
        }
      }
    } catch {
      // File does not exist or is not a directory, continue with default
    }

    return resolvedP; 
  }
}
