import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';

/**
 * Loads and parses pkg-scaffold configuration files.
 * Supports scaffold.config.js, .scaffoldrc.json, and .scaffoldrc.
 */
export class ConfigLoader {
  constructor(context) {
    this.context = context;
  }

  async loadConfig(projectRoot) {
    const searchPaths = [
      'scaffold.config.js',
      'scaffold.config.mjs',
      '.scaffoldrc.json',
      '.scaffoldrc'
    ];

    for (const fileName of searchPaths) {
      const fullPath = path.join(projectRoot, fileName);
      try {
        await fs.access(fullPath);
        
        if (fileName.endsWith('.js') || fileName.endsWith('.mjs')) {
          const module = await import(pathToFileURL(fullPath).href);
          return module.default || module;
        } else {
          const content = await fs.readFile(fullPath, 'utf8');
          return JSON.parse(content);
        }
      } catch (e) {
        continue;
      }
    }

    return this.getDefaultConfig();
  }

  getDefaultConfig() {
    return {
      entryPoints: ['src/index.ts', 'index.js'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.spec.ts'
      ],
      plugins: [],
      rules: {
        'no-unused-exports': 'error',
        'no-unused-vars': 'warn',
        'no-dead-code': 'error'
      }
    };
  }
}
