/**
 * ============================================================================
 * Modern Frameworks Plugins for entkapp v5.0.0
 * ============================================================================
 * Built-in support for React, Vue, Svelte, Angular, Preact, Solid, Qwik, Lit.
 * v5.0.0: All plugins now implement getRequiredPackages() for dependency detection.
 */
import { BasePlugin } from '../BasePlugin.mjs';
import fs from 'fs/promises';
import path from 'path';

export class ReactPlugin extends BasePlugin {
  get name() { return 'react'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() {
    return [
      { name: 'react', dev: false },
      { name: 'react-dom', dev: false },
    ];
  }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.react || pkgJson.devDependencies?.react);
    } catch { return false; }
  }
  getRoutePatterns() { return [/\.(tsx?|jsx?)$/]; }
  getRequiredSystemContracts() {
    return ['default', 'Component', 'PureComponent', 'Fragment', 'useEffect', 'useState',
      'useContext', 'useReducer', 'useCallback', 'useMemo', 'useRef',
      'useImperativeHandle', 'useLayoutEffect', 'useDebugValue'];
  }
  async analyze(node, filePath) {
    if (node.explicitImports?.has('react')) node.isReactComponent = true;
    if (node.rawCode && (node.rawCode.includes('</') || node.rawCode.includes('/>'))) node.hasJSX = true;
    const hookMatches = node.rawCode?.match(/use[A-Z]\w+/g) || [];
    if (hookMatches.length > 0) node.reactHooks = new Set(hookMatches);
  }
}

export class VuePlugin extends BasePlugin {
  get name() { return 'vue'; }
  getConfigFiles() { return ['package.json', 'vue.config.mjs', 'vite.config.ts', 'vite.config.mjs']; }
  getRequiredPackages() {
    return [{ name: 'vue', dev: false }];
  }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.vue || pkgJson.devDependencies?.vue);
    } catch { return false; }
  }
  getRoutePatterns() { return [/\.vue$/, /\.(tsx?|jsx?)$/]; }
  async analyze(node, filePath) {
    if (filePath.endsWith('.vue')) {
      node.isVueSFC = true;
      const templateMatch = node.rawCode?.match(/<template>([\s\S]*)<\/template>/);
      if (templateMatch) node.vueTemplate = templateMatch[1];
      const scriptMatch = node.rawCode?.match(/<script(?: setup)?(?: lang=['"]\w+['"])?>([\s\S]*)<\/script>/);
      if (scriptMatch) node.vueScript = scriptMatch[1];
    }
  }
}

export class SveltePlugin extends BasePlugin {
  get name() { return 'svelte'; }
  getConfigFiles() { return ['package.json', 'svelte.config.mjs']; }
  getRequiredPackages() {
    return [{ name: 'svelte', dev: false }];
  }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.svelte || pkgJson.devDependencies?.svelte);
    } catch { return false; }
  }
  getRoutePatterns() { return [/\.svelte$/, /\.(tsx?|jsx?)$/]; }
  async analyze(node, filePath) {
    if (filePath.endsWith('.svelte')) node.isSvelteComponent = true;
  }
}

export class AngularPlugin extends BasePlugin {
  get name() { return 'angular'; }
  getConfigFiles() { return ['package.json', 'angular.json']; }
  getRequiredPackages() {
    return [
      { name: '@angular/core', dev: false },
      { name: '@angular/common', dev: false },
      { name: '@angular/cli', dev: true, optional: true },
    ];
  }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['@angular/core'] || pkgJson.devDependencies?.['@angular/core']);
    } catch { return false; }
  }
  getRoutePatterns() { return [/\.ts$/]; }
  async analyze(node, filePath) {
    if (node.rawCode?.includes('@Component') || node.rawCode?.includes('@Injectable') || node.rawCode?.includes('@NgModule'))
      node.isAngularEntity = true;
  }
}

export class PreactPlugin extends BasePlugin {
  get name() { return 'preact'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'preact', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.preact || pkgJson.devDependencies?.preact);
    } catch { return false; }
  }
  getRoutePatterns() { return [/\.(tsx?|jsx?)$/]; }
  async analyze(node) {
    if (node.rawCode?.includes('render(') && node.rawCode?.includes('preact')) node.isEntry = true;
  }
}

export class SolidPlugin extends BasePlugin {
  get name() { return 'solid'; }
  getConfigFiles() { return ['package.json', 'vite.config.ts', 'vite.config.mjs']; }
  getRequiredPackages() { return [{ name: 'solid-js', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['solid-js'] || pkgJson.devDependencies?.['solid-js']);
    } catch { return false; }
  }
  getRoutePatterns() { return [/\.(tsx?|jsx?)$/]; }
  getRequiredSystemContracts() { return ['default', 'createSignal', 'createEffect', 'createMemo', 'createResource']; }
}

export class QwikPlugin extends BasePlugin {
  get name() { return 'qwik'; }
  getConfigFiles() { return ['package.json', 'vite.config.ts']; }
  getRequiredPackages() { return [{ name: '@builder.io/qwik', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['@builder.io/qwik'] || pkgJson.devDependencies?.['@builder.io/qwik']);
    } catch { return false; }
  }
  getRoutePatterns() { return [/\.(tsx?|jsx?)$/]; }
  getRequiredSystemContracts() { return ['default', 'component$', 'useSignal', 'useStore', 'useTask$']; }
}

export class LitPlugin extends BasePlugin {
  get name() { return 'lit'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'lit', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.lit || pkgJson.devDependencies?.lit);
    } catch { return false; }
  }
  getRoutePatterns() { return [/\.(ts|js)$/]; }
  getRequiredSystemContracts() { return ['default', 'LitElement', 'html', 'css']; }
}
