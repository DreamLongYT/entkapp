import path from 'path';
import fs from 'fs/promises';
import { BasePlugin } from '../BasePlugin.js';

/**
 * Next.js Plugin for entkapp v5.0.0.
 * Handles next.config detection, App Router and Pages Router patterns,
 * and missing dependency detection.
 */
export class NextJsPlugin extends BasePlugin {
  get name() { return 'nextjs'; }
  getConfigFiles() {
    return ['next.config.js', 'next.config.mjs', 'next.config.ts', 'next.config.cjs'];
  }
  getRequiredPackages() {
    return [
      { name: 'next', dev: false },
      { name: 'react', dev: false },
      { name: 'react-dom', dev: false },
    ];
  }
  getRoutePatterns() {
    return [
      /\/pages\/api\//,
      /\/pages\/[a-zA-Z0-9_\-\[\]]+/i,
      /\/app\/([\w\-\[\]]+\/)+(page|route|layout|loading|error|not-found)\.(ts|tsx|js|jsx)$/
    ];
  }
  getRequiredSystemContracts() {
    return ['default', 'getServerSideProps', 'getStaticProps', 'getStaticPaths', 'generateMetadata', 'middleware'];
  }
  async isActive(baseDir) {
    for (const file of this.getConfigFiles()) {
      try {
        await fs.access(path.join(baseDir, file));
        return true;
      } catch {}
    }
    // Also check if next is in package.json
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.next || pkgJson.devDependencies?.next);
    } catch { return false; }
  }
}
