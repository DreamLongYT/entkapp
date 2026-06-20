/**
 * ============================================================================
 * More Ecosystem Plugins for entkapp v5.0.0
 * ============================================================================
 * Build tools, testing, linting, formatting, and dev tooling plugins.
 * v5.0.0: All plugins implement getRequiredPackages() for dependency detection.
 */
import path from 'path';
import fs from 'fs/promises';
import { BasePlugin } from '../BasePlugin.js';

// ─── BUILD TOOLS ────────────────────────────────────────────────────────────

export class VitePlugin extends BasePlugin {
  get name() { return 'vite'; }
  getConfigFiles() { return ['vite.config.js', 'vite.config.ts', 'vite.config.mjs', 'vite.config.cjs']; }
  getRequiredPackages() { return [{ name: 'vite', dev: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    return false;
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
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.esbuild || pkgJson.devDependencies?.esbuild);
    } catch { return false; }
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
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.rollup || pkgJson.devDependencies?.rollup);
    } catch { return false; }
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
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.webpack || pkgJson.devDependencies?.webpack);
    } catch { return false; }
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
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.parcel || pkgJson.devDependencies?.parcel);
    } catch { return false; }
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

// ─── CSS / STYLING ───────────────────────────────────────────────────────────

export class TailwindPlugin extends BasePlugin {
  get name() { return 'tailwind'; }
  getConfigFiles() { return ['tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.mjs', 'tailwind.config.cjs']; }
  getRequiredPackages() { return [{ name: 'tailwindcss', dev: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.tailwindcss || pkgJson.devDependencies?.tailwindcss);
    } catch { return false; }
  }
}

export class PostcssPlugin extends BasePlugin {
  get name() { return 'postcss'; }
  getConfigFiles() { return ['postcss.config.js', 'postcss.config.cjs', 'postcss.config.mjs', 'postcss.config.ts', '.postcssrc', '.postcssrc.json', '.postcssrc.js']; }
  getRequiredPackages() { return [{ name: 'postcss', dev: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.postcss || pkgJson.devDependencies?.postcss);
    } catch { return false; }
  }
}

export class UnoCSSPlugin extends BasePlugin {
  get name() { return 'unocss'; }
  getConfigFiles() { return ['uno.config.ts', 'uno.config.js', 'unocss.config.ts', 'unocss.config.js']; }
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
  getConfigFiles() { return ['.stylelintrc', '.stylelintrc.js', '.stylelintrc.cjs', '.stylelintrc.json', '.stylelintrc.yml', '.stylelintrc.yaml', 'stylelint.config.js', 'stylelint.config.cjs']; }
  getRequiredPackages() { return [{ name: 'stylelint', dev: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.stylelint || pkgJson.devDependencies?.stylelint);
    } catch { return false; }
  }
}

// ─── LINTING / FORMATTING ────────────────────────────────────────────────────

export class EslintPlugin extends BasePlugin {
  get name() { return 'eslint'; }
  getConfigFiles() { return ['.eslintrc', '.eslintrc.js', '.eslintrc.cjs', '.eslintrc.json', '.eslintrc.yml', '.eslintrc.yaml', 'eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs']; }
  getRequiredPackages() { return [{ name: 'eslint', dev: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.eslint || pkgJson.devDependencies?.eslint);
    } catch { return false; }
  }
}

export class PrettierPlugin extends BasePlugin {
  get name() { return 'prettier'; }
  getConfigFiles() { return ['.prettierrc', '.prettierrc.js', '.prettierrc.cjs', '.prettierrc.json', '.prettierrc.yml', '.prettierrc.yaml', '.prettierrc.toml', 'prettier.config.js', 'prettier.config.cjs', 'prettier.config.mjs']; }
  getRequiredPackages() { return [{ name: 'prettier', dev: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.prettier || pkgJson.devDependencies?.prettier);
    } catch { return false; }
  }
}

export class BiomePlugin extends BasePlugin {
  get name() { return 'biome'; }
  getConfigFiles() { return ['biome.json', 'biome.jsonc']; }
  getRequiredPackages() { return [{ name: '@biomejs/biome', dev: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    return false;
  }
}

export class OxlintPlugin extends BasePlugin {
  get name() { return 'oxlint'; }
  getConfigFiles() { return ['.oxlintrc', '.oxlintrc.json', 'oxlint.json']; }
  getRequiredPackages() { return [{ name: 'oxlint', dev: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.oxlint || pkgJson.devDependencies?.oxlint);
    } catch { return false; }
  }
}

// ─── GIT HOOKS / COMMIT TOOLING ──────────────────────────────────────────────

export class HuskyPlugin extends BasePlugin {
  get name() { return 'husky'; }
  getConfigFiles() { return ['.husky/pre-commit', '.husky/pre-push', '.husky/commit-msg', '.husky/_/husky.sh']; }
  getRequiredPackages() { return [{ name: 'husky', dev: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.husky || pkgJson.devDependencies?.husky);
    } catch { return false; }
  }
}

export class LintStagedPlugin extends BasePlugin {
  get name() { return 'lint-staged'; }
  getConfigFiles() { return ['.lintstagedrc', '.lintstagedrc.js', '.lintstagedrc.cjs', '.lintstagedrc.json', '.lintstagedrc.yml', '.lintstagedrc.yaml', 'lint-staged.config.js', 'lint-staged.config.cjs']; }
  getRequiredPackages() { return [{ name: 'lint-staged', dev: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      if (pkgJson['lint-staged']) return true;
      return !!(pkgJson.dependencies?.['lint-staged'] || pkgJson.devDependencies?.['lint-staged']);
    } catch { return false; }
  }
}

export class CommitlintPlugin extends BasePlugin {
  get name() { return 'commitlint'; }
  getConfigFiles() { return ['.commitlintrc', '.commitlintrc.js', '.commitlintrc.cjs', '.commitlintrc.json', '.commitlintrc.yml', '.commitlintrc.yaml', 'commitlint.config.js', 'commitlint.config.cjs', 'commitlint.config.ts']; }
  getRequiredPackages() { return [{ name: '@commitlint/cli', dev: true }, { name: '@commitlint/config-conventional', dev: true, optional: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['@commitlint/cli'] || pkgJson.devDependencies?.['@commitlint/cli']);
    } catch { return false; }
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

// ─── TRANSPILERS ─────────────────────────────────────────────────────────────

export class BabelPlugin extends BasePlugin {
  get name() { return 'babel'; }
  getConfigFiles() { return ['.babelrc', '.babelrc.js', '.babelrc.cjs', '.babelrc.json', '.babelrc.mjs', 'babel.config.js', 'babel.config.cjs', 'babel.config.json', 'babel.config.mjs']; }
  getRequiredPackages() { return [{ name: '@babel/core', dev: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['@babel/core'] || pkgJson.devDependencies?.['@babel/core']);
    } catch { return false; }
  }
}

export class SWCPlugin extends BasePlugin {
  get name() { return 'swc'; }
  getConfigFiles() { return ['.swcrc', '.swcrc.json']; }
  getRequiredPackages() { return [{ name: '@swc/core', dev: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['@swc/core'] || pkgJson.devDependencies?.['@swc/core']);
    } catch { return false; }
  }
}

// ─── TESTING ─────────────────────────────────────────────────────────────────

export class JestPlugin extends BasePlugin {
  get name() { return 'jest'; }
  getConfigFiles() { return ['jest.config.js', 'jest.config.ts', 'jest.config.mjs', 'jest.config.cjs', 'jest.config.json']; }
  getRequiredPackages() { return [{ name: 'jest', dev: true }]; }
  getRoutePatterns() { return [/\.test\.[jt]sx?$/, /\.spec\.[jt]sx?$/]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      if (pkgJson.jest) return true;
      return !!(pkgJson.dependencies?.jest || pkgJson.devDependencies?.jest);
    } catch { return false; }
  }
}

export class VitestPlugin extends BasePlugin {
  get name() { return 'vitest'; }
  getConfigFiles() { return ['vitest.config.js', 'vitest.config.ts', 'vitest.config.mjs', 'vitest.workspace.ts', 'vitest.workspace.js']; }
  getRequiredPackages() { return [{ name: 'vitest', dev: true }]; }
  getRoutePatterns() { return [/\.test\.[jt]sx?$/, /\.spec\.[jt]sx?$/]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.vitest || pkgJson.devDependencies?.vitest);
    } catch { return false; }
  }
}

export class PlaywrightPlugin extends BasePlugin {
  get name() { return 'playwright'; }
  getConfigFiles() { return ['playwright.config.ts', 'playwright.config.js']; }
  getRequiredPackages() { return [{ name: '@playwright/test', dev: true }]; }
  getRoutePatterns() { return [/\.spec\.ts$/, /\.spec\.js$/]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['@playwright/test'] || pkgJson.devDependencies?.['@playwright/test']);
    } catch { return false; }
  }
}

export class CypressPlugin extends BasePlugin {
  get name() { return 'cypress'; }
  getConfigFiles() { return ['cypress.config.ts', 'cypress.config.js', 'cypress.json']; }
  getRequiredPackages() { return [{ name: 'cypress', dev: true }]; }
  getRoutePatterns() { return [/cypress\/e2e\/.*\.cy\.[jt]s$/]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.cypress || pkgJson.devDependencies?.cypress);
    } catch { return false; }
  }
}

export class StorybookPlugin extends BasePlugin {
  get name() { return 'storybook'; }
  getConfigFiles() { return ['.storybook/main.js', '.storybook/main.ts', '.storybook/main.cjs', '.storybook/preview.js', '.storybook/preview.ts']; }
  getRequiredPackages() { return [{ name: 'storybook', dev: true, optional: true }, { name: '@storybook/react', dev: true, optional: true }]; }
  getRoutePatterns() { return [/\.stories\.[jt]sx?$/]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      const allDeps = { ...(pkgJson.dependencies || {}), ...(pkgJson.devDependencies || {}) };
      return Object.keys(allDeps).some(k => k.startsWith('@storybook/') || k === 'storybook');
    } catch { return false; }
  }
}

export class MswPlugin extends BasePlugin {
  get name() { return 'msw'; }
  getConfigFiles() { return ['msw.config.ts', 'msw.config.js', 'public/mockServiceWorker.js']; }
  getRequiredPackages() { return [{ name: 'msw', dev: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.msw || pkgJson.devDependencies?.msw);
    } catch { return false; }
  }
}

// ─── CI / INFRA ──────────────────────────────────────────────────────────────

export class GithubActionsPlugin extends BasePlugin {
  get name() { return 'github-actions'; }
  getConfigFiles() { return ['.github/workflows']; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, '.github/workflows')); return true; } catch { return false; }
  }
}

export class DockerPlugin extends BasePlugin {
  get name() { return 'docker'; }
  getConfigFiles() { return ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml', 'docker-compose.dev.yml', '.dockerignore']; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    return false;
  }
}

export class TerraformPlugin extends BasePlugin {
  get name() { return 'terraform'; }
  getConfigFiles() { return ['main.tf', 'variables.tf', 'outputs.tf', 'terraform.tfvars']; }
  getRoutePatterns() { return [/\.tf$/]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    return false;
  }
}

// ─── DEV ENVIRONMENT ─────────────────────────────────────────────────────────

export class EditorConfigPlugin extends BasePlugin {
  get name() { return 'editorconfig'; }
  getConfigFiles() { return ['.editorconfig']; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, '.editorconfig')); return true; } catch { return false; }
  }
}

export class NvmPlugin extends BasePlugin {
  get name() { return 'nvm'; }
  getConfigFiles() { return ['.nvmrc', '.node-version']; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    return false;
  }
}

export class VoltaPlugin extends BasePlugin {
  get name() { return 'volta'; }
  getConfigFiles() { return ['package.json']; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.volta);
    } catch { return false; }
  }
}

export class DotenvPlugin extends BasePlugin {
  get name() { return 'dotenv'; }
  getConfigFiles() { return ['.env', '.env.local', '.env.development', '.env.production', '.env.test', '.env.example', '.env.sample']; }
  getRequiredPackages() { return [{ name: 'dotenv', dev: false, optional: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    return false;
  }
}

// ─── PACKAGE MANAGERS ────────────────────────────────────────────────────────

export class PnpmPlugin extends BasePlugin {
  get name() { return 'pnpm'; }
  getConfigFiles() { return ['pnpm-lock.yaml', 'pnpm-workspace.yaml']; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, 'pnpm-lock.yaml')); return true; } catch { return false; }
  }
}

export class YarnPlugin extends BasePlugin {
  get name() { return 'yarn'; }
  getConfigFiles() { return ['yarn.lock', '.yarnrc.yml', '.yarnrc']; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, 'yarn.lock')); return true; } catch { return false; }
  }
}

export class BunPlugin extends BasePlugin {
  get name() { return 'bun'; }
  getConfigFiles() { return ['bun.lockb', 'bunfig.toml']; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    return false;
  }
}

// ─── MISC UTILITIES ──────────────────────────────────────────────────────────

export class SwiperPlugin extends BasePlugin {
  get name() { return 'swiper'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'swiper', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.swiper || pkgJson.devDependencies?.swiper);
    } catch { return false; }
  }
  async analyze(node) {
    if (node.rawCode?.includes('new Swiper(')) node.isEntry = true;
  }
}

export class QuillPlugin extends BasePlugin {
  get name() { return 'quill'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'quill', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.quill || pkgJson.devDependencies?.quill);
    } catch { return false; }
  }
  async analyze(node) {
    if (node.rawCode?.includes('new Quill(')) node.isEntry = true;
  }
}

export class EnvelopPlugin extends BasePlugin {
  get name() { return 'envelop'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: '@envelop/core', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      const allDeps = { ...(pkgJson.dependencies || {}), ...(pkgJson.devDependencies || {}) };
      return Object.keys(allDeps).some(k => k.startsWith('@envelop/'));
    } catch { return false; }
  }
  async analyze(node) {
    if (node.rawCode?.includes('useEnvelop(')) node.isEntry = true;
  }
}
