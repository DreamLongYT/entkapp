/**
 * ============================================================================
 * New Ecosystem Plugins for entkapp v5.0.0
 * ============================================================================
 * State management, routing, animation, validation, i18n, monitoring, and more.
 * All plugins implement getRequiredPackages() for dependency detection.
 */
import path from 'path';
import fs from 'fs/promises';
import { BasePlugin } from '../BasePlugin.mjs';

// ─── STATE MANAGEMENT ────────────────────────────────────────────────────────

export class ReduxPlugin extends BasePlugin {
  get name() { return 'redux'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: '@reduxjs/toolkit', dev: false }, { name: 'react-redux', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['@reduxjs/toolkit'] || pkgJson.dependencies?.redux || pkgJson.devDependencies?.['@reduxjs/toolkit']);
    } catch { return false; }
  }
  async analyze(node) {
    if (node.rawCode?.includes('createSlice(') || node.rawCode?.includes('configureStore(')) node.isEntry = true;
  }
}

export class ZustandPlugin extends BasePlugin {
  get name() { return 'zustand'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'zustand', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.zustand || pkgJson.devDependencies?.zustand);
    } catch { return false; }
  }
  async analyze(node) {
    if (node.rawCode?.includes('create(') && node.rawCode?.includes('set =>')) node.isEntry = true;
  }
}

export class JotaiPlugin extends BasePlugin {
  get name() { return 'jotai'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'jotai', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.jotai || pkgJson.devDependencies?.jotai);
    } catch { return false; }
  }
  async analyze(node) {
    if (node.rawCode?.includes('atom(')) node.isEntry = true;
  }
}

export class RecoilPlugin extends BasePlugin {
  get name() { return 'recoil'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'recoil', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.recoil || pkgJson.devDependencies?.recoil);
    } catch { return false; }
  }
}

export class MobXPlugin extends BasePlugin {
  get name() { return 'mobx'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'mobx', dev: false }, { name: 'mobx-react-lite', dev: false, optional: true }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.mobx || pkgJson.devDependencies?.mobx);
    } catch { return false; }
  }
}

export class PiniaPlugin extends BasePlugin {
  get name() { return 'pinia'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'pinia', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.pinia || pkgJson.devDependencies?.pinia);
    } catch { return false; }
  }
}

export class TanStackQueryPlugin extends BasePlugin {
  get name() { return 'tanstack-query'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: '@tanstack/react-query', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      const allDeps = { ...(pkgJson.dependencies || {}), ...(pkgJson.devDependencies || {}) };
      return Object.keys(allDeps).some(k => k.startsWith('@tanstack/') && k.includes('query'));
    } catch { return false; }
  }
}

// ─── ROUTING ─────────────────────────────────────────────────────────────────

export class ReactRouterPlugin extends BasePlugin {
  get name() { return 'react-router'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'react-router-dom', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['react-router-dom'] || pkgJson.dependencies?.['react-router'] ||
               pkgJson.devDependencies?.['react-router-dom']);
    } catch { return false; }
  }
  getRequiredSystemContracts() { return ['default', 'Route', 'Routes', 'Link', 'useNavigate', 'useParams', 'useLocation']; }
}

export class TanStackRouterPlugin extends BasePlugin {
  get name() { return 'tanstack-router'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: '@tanstack/react-router', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      const allDeps = { ...(pkgJson.dependencies || {}), ...(pkgJson.devDependencies || {}) };
      return Object.keys(allDeps).some(k => k.startsWith('@tanstack/') && k.includes('router'));
    } catch { return false; }
  }
}

export class VueRouterPlugin extends BasePlugin {
  get name() { return 'vue-router'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'vue-router', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['vue-router'] || pkgJson.devDependencies?.['vue-router']);
    } catch { return false; }
  }
}

// ─── UI COMPONENTS ───────────────────────────────────────────────────────────

export class AntdPlugin extends BasePlugin {
  get name() { return 'antd'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'antd', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.antd || pkgJson.devDependencies?.antd);
    } catch { return false; }
  }
  async analyze(node) {
    if (node.rawCode?.includes('from "antd"') || node.rawCode?.includes("from 'antd'")) node.isEntry = true;
  }
}

export class MuiPlugin extends BasePlugin {
  get name() { return 'mui'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: '@mui/material', dev: false }, { name: '@emotion/react', dev: false }, { name: '@emotion/styled', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['@mui/material'] || pkgJson.devDependencies?.['@mui/material']);
    } catch { return false; }
  }
  async analyze(node) {
    if (node.rawCode?.includes('@mui/material')) node.isEntry = true;
  }
}

export class ShadcnPlugin extends BasePlugin {
  get name() { return 'shadcn'; }
  getConfigFiles() { return ['components.json']; }
  getRequiredPackages() { return [{ name: 'class-variance-authority', dev: false }, { name: 'clsx', dev: false }]; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, 'components.json')); return true; } catch { return false; }
  }
}

export class RadixUIPlugin extends BasePlugin {
  get name() { return 'radix-ui'; }
  getConfigFiles() { return ['package.json']; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      const allDeps = { ...(pkgJson.dependencies || {}), ...(pkgJson.devDependencies || {}) };
      return Object.keys(allDeps).some(k => k.startsWith('@radix-ui/'));
    } catch { return false; }
  }
}

export class ChakraUIPlugin extends BasePlugin {
  get name() { return 'chakra-ui'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: '@chakra-ui/react', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['@chakra-ui/react'] || pkgJson.devDependencies?.['@chakra-ui/react']);
    } catch { return false; }
  }
}

// ─── ANIMATION ───────────────────────────────────────────────────────────────

export class FramerMotionPlugin extends BasePlugin {
  get name() { return 'framer-motion'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'framer-motion', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['framer-motion'] || pkgJson.devDependencies?.['framer-motion']);
    } catch { return false; }
  }
}

export class GSAPPlugin extends BasePlugin {
  get name() { return 'gsap'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'gsap', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.gsap || pkgJson.devDependencies?.gsap);
    } catch { return false; }
  }
}

// ─── VALIDATION ──────────────────────────────────────────────────────────────

export class ZodPlugin extends BasePlugin {
  get name() { return 'zod'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'zod', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.zod || pkgJson.devDependencies?.zod);
    } catch { return false; }
  }
}

export class YupPlugin extends BasePlugin {
  get name() { return 'yup'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'yup', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.yup || pkgJson.devDependencies?.yup);
    } catch { return false; }
  }
}

export class ValibotPlugin extends BasePlugin {
  get name() { return 'valibot'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'valibot', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.valibot || pkgJson.devDependencies?.valibot);
    } catch { return false; }
  }
}

// ─── INTERNATIONALISATION ────────────────────────────────────────────────────

export class I18nextPlugin extends BasePlugin {
  get name() { return 'i18next'; }
  getConfigFiles() { return ['i18next.config.mjs', 'i18next.config.ts', 'next-i18next.config.mjs']; }
  getRequiredPackages() { return [{ name: 'i18next', dev: false }, { name: 'react-i18next', dev: false, optional: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.i18next || pkgJson.devDependencies?.i18next);
    } catch { return false; }
  }
}

export class VueI18nPlugin extends BasePlugin {
  get name() { return 'vue-i18n'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'vue-i18n', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['vue-i18n'] || pkgJson.devDependencies?.['vue-i18n']);
    } catch { return false; }
  }
}

// ─── MONITORING / OBSERVABILITY ──────────────────────────────────────────────

export class SentryPlugin extends BasePlugin {
  get name() { return 'sentry'; }
  getConfigFiles() { return ['sentry.client.config.ts', 'sentry.server.config.ts', 'sentry.edge.config.ts', 'sentry.config.mjs', 'sentry.config.ts']; }
  getRequiredPackages() { return [{ name: '@sentry/nextjs', dev: false, optional: true }, { name: '@sentry/react', dev: false, optional: true }, { name: '@sentry/node', dev: false, optional: true }]; }
  async isActive(baseDir) {
    for (const f of this.getConfigFiles()) {
      try { await fs.access(path.join(baseDir, f)); return true; } catch {}
    }
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      const allDeps = { ...(pkgJson.dependencies || {}), ...(pkgJson.devDependencies || {}) };
      return Object.keys(allDeps).some(k => k.startsWith('@sentry/'));
    } catch { return false; }
  }
}

export class OpenTelemetryPlugin extends BasePlugin {
  get name() { return 'opentelemetry'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: '@opentelemetry/api', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      const allDeps = { ...(pkgJson.dependencies || {}), ...(pkgJson.devDependencies || {}) };
      return Object.keys(allDeps).some(k => k.startsWith('@opentelemetry/'));
    } catch { return false; }
  }
}

// ─── BACKEND FRAMEWORKS ──────────────────────────────────────────────────────

export class ExpressPlugin extends BasePlugin {
  get name() { return 'express'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'express', dev: false }]; }
  getRoutePatterns() { return [/\/routes\//, /\/controllers\//]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.express || pkgJson.devDependencies?.express);
    } catch { return false; }
  }
  async analyze(node) {
    if (node.rawCode?.includes('express()') || node.rawCode?.includes('express.Router()')) node.isEntry = true;
    if (node.params?.length === 4) node.isEntry = true;
  }
}

export class FastifyPlugin extends BasePlugin {
  get name() { return 'fastify'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'fastify', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.fastify || pkgJson.devDependencies?.fastify);
    } catch { return false; }
  }
  async analyze(node) {
    if (node.rawCode?.includes('Fastify(') || node.rawCode?.includes('.register(')) node.isEntry = true;
  }
}

export class NestJsPlugin extends BasePlugin {
  get name() { return 'nestjs'; }
  getConfigFiles() { return ['nest-cli.json', 'package.json']; }
  getRequiredPackages() { return [{ name: '@nestjs/core', dev: false }, { name: '@nestjs/common', dev: false }]; }
  async isActive(baseDir) {
    try { await fs.access(path.join(baseDir, 'nest-cli.json')); return true; } catch {}
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['@nestjs/core'] || pkgJson.devDependencies?.['@nestjs/core']);
    } catch { return false; }
  }
  async analyze(node) {
    if (node.rawCode?.includes('@Module') || node.rawCode?.includes('@Controller') || node.rawCode?.includes('@Injectable'))
      node.isEntry = true;
  }
}

export class HonoPlugin extends BasePlugin {
  get name() { return 'hono'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'hono', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.hono || pkgJson.devDependencies?.hono);
    } catch { return false; }
  }
  async analyze(node) {
    if (node.rawCode?.includes('new Hono()')) node.isEntry = true;
  }
}

export class KoaPlugin extends BasePlugin {
  get name() { return 'koa'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'koa', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.koa || pkgJson.devDependencies?.koa);
    } catch { return false; }
  }
  async analyze(node) {
    if (node.rawCode?.includes('new Koa()')) node.isEntry = true;
  }
}

export class ElysiaPlugin extends BasePlugin {
  get name() { return 'elysia'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'elysia', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.elysia || pkgJson.devDependencies?.elysia);
    } catch { return false; }
  }
  async analyze(node) {
    if (node.rawCode?.includes('new Elysia()')) node.isEntry = true;
  }
}

// ─── REAL-TIME ────────────────────────────────────────────────────────────────

export class SocketIoPlugin extends BasePlugin {
  get name() { return 'socketio'; }
  getConfigFiles() { return ['package.json']; }
  getRequiredPackages() { return [{ name: 'socket.io', dev: false }]; }
  async isActive(baseDir) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(path.join(baseDir, 'package.json'), 'utf8'));
      return !!(pkgJson.dependencies?.['socket.io'] || pkgJson.devDependencies?.['socket.io']);
    } catch { return false; }
  }
  async analyze(node) {
    if (node.rawCode?.includes('io.on(') || node.rawCode?.includes('socket.on(')) node.isEntry = true;
  }
}

// ─── PACKAGE MANAGER DETECTION ───────────────────────────────────────────────

export class PnpmPlugin extends BasePlugin {
  get name() { return 'pnpm'; }
  getConfigFiles() { return ['pnpm-lock.yaml', 'pnpm-workspace.yaml', '.npmrc']; }
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
