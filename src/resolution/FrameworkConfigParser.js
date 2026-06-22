import path from 'path';
import fs from 'fs';

/**
 * Lightweight Static Analysis Parser for Vite / Vitest / Framework Configurations.
 * Extracts 'resolve.alias' and 'build.lib.entry' without executing the file.
 * Version 5.4.0: Added poly-extension path resolution.
 */
export class FrameworkConfigParser {
  constructor(context) {
    this.context = context;
  }

  /**
   * Parses a Framework configuration file and extracts structural metadata.
   * @param {string} content - Raw source code of the config file
   * @param {string} filePath - Absolute path to the config file
   * @returns {Object} { aliases: Map<string, string>, entries: Set<string> }
   */
  parse(content, filePath) {
    const results = {
      aliases: new Map(),
      entries: new Set()
    };

    if (!content) return results;

    const configDir = path.dirname(filePath);

    // 1. Extract Aliases from resolve: { alias: { ... } } or alias: [ ... ]
    this._extractAliases(content, configDir, results.aliases);

    // 2. Extract Entry Points from build: { lib: { entry: '...' } } or rollupOptions: { input: '...' }
    this._extractEntries(content, configDir, results.entries);

    return results;
  }

  _extractAliases(content, configDir, aliasMap) {
    const objAliasPatterns = [
      /alias\s*:\s*\{([\s\S]*?)\}/g,
      /resolve\s*:\s*\{[\s\S]*?alias\s*:\s*\{([\s\S]*?)\}/g
    ];

    for (const pattern of objAliasPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const inner = match[1];
        const pairPattern = /(?:['"]?)(@?[a-zA-Z0-9_\-\/*]+)(?:['"]?)\s*:\s*(?:['"]([^'"]+)['"]|(path\.(?:resolve|join)\([\s\S]*?\)))/g;
        let pair;
        while ((pair = pairPattern.exec(inner)) !== null) {
          const [_, key, stringVal, callVal] = pair;
          aliasMap.set(key, this._resolveValue(stringVal || callVal, configDir));
        }
      }
    }

    const arrAliasPattern = /alias\s*:\s*\[([\s\S]*?)\]/;
    const arrMatch = arrAliasPattern.exec(content);
    if (arrMatch) {
      const inner = arrMatch[1];
      const findPattern = /\{\s*find\s*:\s*['"]([^'"]+)['"]\s*,\s*replacement\s*:\s*['"]([^'"]+)['"]\s*\}/g;
      let findMatch;
      while ((findMatch = findPattern.exec(inner)) !== null) {
        const [_, key, value] = findMatch;
        aliasMap.set(key, this._resolveValue(value, configDir));
      }
    }
  }

  _extractEntries(content, configDir, entrySet) {
    const libEntryPattern = /entry\s*:\s*['"]([^'"]+)['"]/;
    const libMatch = libEntryPattern.exec(content);
    if (libMatch) {
      entrySet.add(this._resolveValue(libMatch[1], configDir));
    }

    const inputPattern = /input\s*:\s*(?:['"]([^'"]+)['"]|\[([\s\S]*?)\])/;
    const inputMatch = inputPattern.exec(content);
    if (inputMatch) {
      if (inputMatch[1]) {
        entrySet.add(this._resolveValue(inputMatch[1], configDir));
      } else if (inputMatch[2]) {
        const paths = inputMatch[2].match(/['"]([^'"]+)['"]/g);
        if (paths) {
          paths.forEach(p => entrySet.add(this._resolveValue(p.replace(/['"]/g, ''), configDir)));
        }
      }
    }
  }

  /**
   * Resolves a path value and applies poly-extension fallback if the file doesn't exist.
   */
  _resolveValue(val, configDir) {
    const pathCallPattern = /path\.(?:resolve|join)\s*\(\s*(?:__dirname\s*,\s*)?['"]([^'"]+)['"]\s*\)/;
    const pathMatch = pathCallPattern.exec(val);
    if (pathMatch) {
      val = pathMatch[1];
    }

    if (val.startsWith('.') || val.startsWith('/') || /^[a-zA-Z]:/.test(val)) {
      let resolved = path.resolve(configDir, val).replace(/\\/g, '/');
      
      // UPGRADE: Poly-extension fallback
      if (!fs.existsSync(resolved)) {
        const base = resolved.replace(/\.[a-zA-Z0-9]+$/, '');
        const extensions = ['.ts', '.js', '.tsx', '.jsx', '.mjs', '.cjs'];
        for (const ext of extensions) {
          if (fs.existsSync(base + ext)) {
            return (base + ext).replace(/\\/g, '/');
          }
        }
      }
      return resolved;
    }
    return val;
  }
}
