import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

/**
 * Entkapp Initializer: Analyzes the codebase to generate a package.json
 * with correctly categorized dependencies and devDependencies.
 */
export class Initializer {
  constructor(context) {
    this.context = context;
  }

  async run() {
    console.log("🚀 Starting entkapp intelligent initialization...");
    const cwd = this.context.cwd || process.cwd();
    
    // 1. Scan for all JS/TS files
    const files = await glob('**/*.{js,ts,jsx,tsx,vue,svelte,astro}', { 
      ignore: ['node_modules/**', 'dist/**', '.git/**'],
      cwd 
    });

    const dependencies = new Set();
    const devDependencies = new Set();

    // Common dev tool indicators
    const devIndicators = ['test', 'spec', 'config', 'stories', 'mock'];

    console.log(`🔍 Analyzing ${files.length} files for imports...`);

    for (const file of files) {
      const content = await fs.readFile(path.join(cwd, file), 'utf8');
      const isDevFile = devIndicators.some(ind => file.toLowerCase().includes(ind));

      // Simple but effective regex for imports
      const importMatches = content.matchAll(/(?:import|from|require)\s*\(?\s*['"]([^' "./][^'"]*)['"]/g);
      
      for (const match of importMatches) {
        const pkg = this.extractPackageName(match[1]);
        if (pkg && !this.isBuiltIn(pkg)) {
          if (isDevFile) devDependencies.add(pkg);
          else dependencies.add(pkg);
        }
      }
    }

    // 2. Generate package.json
    const pkgJson = {
      name: path.basename(cwd),
      version: "1.0.0",
      description: "Initialized with entkapp",
      main: "index.js",
      scripts: {
        "entkapp:run": "entkapp -r",
        "entkapp:check": "entkapp --verbose"
      },
      dependencies: Object.fromEntries([...dependencies].sort().map(d => [d, "latest"])),
      devDependencies: Object.fromEntries([...devDependencies].sort().map(d => [d, "latest"]))
    };

    await fs.writeFile(path.join(cwd, 'package.json'), JSON.stringify(pkgJson, null, 2));
    console.log("✅ package.json generated with analyzed dependencies.");
    
    // 3. Create /entkapp folder
    await fs.mkdir(path.join(cwd, 'entkapp'), { recursive: true });
    console.log("✅ /entkapp configuration folder created.");
  }

  extractPackageName(specifier) {
    if (specifier.startsWith('@')) {
      const parts = specifier.split('/');
      return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : null;
    }
    return specifier.split('/')[0];
  }

  isBuiltIn(pkg) {
    const builtins = ['path', 'fs', 'os', 'crypto', 'http', 'https', 'stream', 'util', 'events', 'module', 'process'];
    return builtins.includes(pkg) || pkg.startsWith('node:');
  }
}
