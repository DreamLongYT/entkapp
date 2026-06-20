import fs from 'fs';
import path from 'path';

export class PathMapper {
  constructor(context) { 
    this.context = context; 
  }
  
  async loadMappings() {
    // Tsconfig paths can be loaded here later
  }

  /**
   * Resolves physical module paths on disk, translating modern .js imports 
   * back to their actual TypeScript source files.
   * @param {string} p - The target module specifier or absolute path
   */
  resolvePath(p) {
    if (!p || typeof p !== 'string') return p;

    // FIX 1: If the import ends with .js, translate it to .ts for the search
    if (p.endsWith('.js')) {
      const tsPath = p.slice(0, -3) + '.ts';
      if (fs.existsSync(tsPath)) return tsPath;
    }

    // FIX 2: If the import ends with .jsx, translate it to .tsx for the search
    if (p.endsWith('.jsx')) {
      const tsxPath = p.slice(0, -4) + '.tsx';
      if (fs.existsSync(tsxPath)) return tsxPath;
    }

    // FIX 3: Support for directory imports (z.B. ./adapters -> ./adapters/index.ts)
    try {
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        const extensions = ['.ts', '.tsx', '.js', '.jsx'];
        for (const ext of extensions) {
          const indexPath = path.join(p, `index${ext}`);
          if (fs.existsSync(indexPath)) return indexPath;
        }
      }
    } catch {
      // File does not exist or is not a directory, continue with default
    }

    return p; 
  }
}
