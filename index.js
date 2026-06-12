#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { builtinModules, createRequire } from 'module';
import { execSync } from 'child_process';
import readline from 'readline/promises';

// --- Bulletproof AST Infrastructure Engines ---
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.turbo', 'coverage', 'out', '.next', '.nuxt', '.svelte-kit', 'storybook-static', '.cache']);
const VALID_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue', '.svelte']);

// --- Refined Target Signature Dictionaries ---
const REGEX_PATTERNS = {
    env: /(?:process\.env|import\.meta\.env)\.([A-Z_][A-Z0-9_]*)/g,
    testFile: /\.(test|spec)\.(js|ts|jsx|tsx|mjs|cjs)$/i,
    configFile: /^(vite|webpack|rollup|babel|jest|vitest|tailwind|postcss|next|nuxt|svelte|astro)\.config\./i,

    // Modern Quality & Structural Code Smell Monitors
    legacyVar: /\bvar\s+[a-zA-Z_]/g,
    dangerousEval: /\beval\s*\(/g,
    syncFsCalls: /\.readFileSync|\.writeFileSync|\.mkdirSync|\.existsSync/g,

    // Cryptographic Risk & Hardcoded Keyholes
    secretKeys: /\b(secret|passwd|password|token|api_?key|private_?key)\s*=\s*['"`]([a-zA-Z0-9_\-\.]{8,})['"`]/gi
};

// ============================================================
// COMPREHENSIVE BINARY-TO-PACKAGE MAPPING (Knip-style)
// Maps CLI binary names → npm package names
// ============================================================
const BINARY_TO_PACKAGE_MAP = {
    // TypeScript / JavaScript compilers & runtimes
    'tsc': 'typescript',
    'ts-node': 'ts-node',
    'tsx': 'tsx',
    'tsup': 'tsup',
    'esbuild': 'esbuild',
    'swc': '@swc/cli',

    // Test runners
    'jest': 'jest',
    'vitest': 'vitest',
    'mocha': 'mocha',
    'jasmine': 'jasmine',
    'ava': 'ava',
    'tap': 'tap',
    'c8': 'c8',
    'nyc': 'nyc',

    // Linters & formatters
    'eslint': 'eslint',
    'prettier': 'prettier',
    'biome': '@biomejs/biome',
    'oxlint': 'oxlint',
    'tslint': 'tslint',
    'xo': 'xo',
    'standard': 'standard',

    // Bundlers & dev servers
    'vite': 'vite',
    'webpack': 'webpack',
    'rollup': 'rollup',
    'parcel': 'parcel',
    'turbo': 'turbo',
    'nx': 'nx',

    // Process managers & watchers
    'nodemon': 'nodemon',
    'pm2': 'pm2',
    'concurrently': 'concurrently',
    'cross-env': 'cross-env',
    'dotenv-cli': 'dotenv-cli',
    'env-cmd': 'env-cmd',

    // Code generation & scaffolding
    'hygen': 'hygen',
    'plop': 'plop',
    'prisma': 'prisma',
    'drizzle-kit': 'drizzle-kit',
    'typeorm': 'typeorm',
    'sequelize': 'sequelize-cli',
    'knex': 'knex',
    'mikro-orm': '@mikro-orm/cli',

    // Build & deployment tools
    'rimraf': 'rimraf',
    'copyfiles': 'copyfiles',
    'mkdirp': 'mkdirp',
    'shx': 'shx',
    'ncp': 'ncp',
    'cpx': 'cpx',
    'npm-run-all': 'npm-run-all',
    'run-s': 'npm-run-all',
    'run-p': 'npm-run-all',

    // Documentation
    'typedoc': 'typedoc',
    'jsdoc': 'jsdoc',
    'storybook': 'storybook',
    'sb': 'storybook',

    // Misc
    'husky': 'husky',
    'lint-staged': 'lint-staged',
    'commitlint': '@commitlint/cli',
    'release-it': 'release-it',
    'semantic-release': 'semantic-release',
    'changeset': '@changesets/cli',
    'changesets': '@changesets/cli',
    'np': 'np',
    'bumpp': 'bumpp',
};

// ============================================================
// EXTENDED DEV TOOLING ECOSYSTEM (never flagged as unused)
// ============================================================
const DEV_TOOLING_ECOSYSTEM = new Set([
    // Linters & formatters
    'eslint', 'prettier', 'biome', '@biomejs/biome', 'oxlint', 'tslint', 'xo', 'standard',
    // TypeScript
    'typescript', 'typescript-eslint', '@eslint/js', 'ts-node', 'tsx', 'tsup', 'esbuild', '@swc/cli',
    // Test runners
    'jest', 'vitest', 'mocha', 'jasmine', 'ava', 'tap', 'c8', 'nyc',
    // Bundlers
    'vite', 'webpack', 'rollup', 'parcel', 'turbo', 'nx',
    // Process managers
    'nodemon', 'pm2', 'concurrently', 'cross-env', 'dotenv-cli', 'env-cmd',
    // Build helpers
    'rimraf', 'copyfiles', 'mkdirp', 'shx', 'ncp', 'cpx', 'npm-run-all',
    // Docs
    'typedoc', 'jsdoc', 'storybook',
    // Release
    'husky', 'lint-staged', '@commitlint/cli', 'release-it', 'semantic-release', '@changesets/cli', 'np', 'bumpp',
    // ORM CLI tools
    'prisma', 'drizzle-kit', 'typeorm', 'sequelize-cli', 'knex', '@mikro-orm/cli',
    // Scaffolding
    'hygen', 'plop',
]);

// ============================================================
// KNOWN PACKAGE ALIASES (package name → common import name)
// e.g. "lodash" is imported as "_", "express" as "app", etc.
// This helps avoid false positives in unused detection
// ============================================================
const PACKAGE_IMPORT_ALIASES = {
    'lodash': ['_', 'lodash'],
    'lodash-es': ['_', 'lodash'],
    'underscore': ['_'],
    'jquery': ['$', 'jQuery'],
    'moment': ['moment'],
    'dayjs': ['dayjs'],
    'date-fns': ['dateFns'],
    'ramda': ['R'],
    'rxjs': ['Rx'],
    'three': ['THREE'],
    'chart.js': ['Chart'],
    'socket.io': ['io', 'Server'],
    'socket.io-client': ['io'],
    'mongoose': ['mongoose'],
    'sequelize': ['Sequelize'],
    'typeorm': ['typeorm'],
    'prisma': ['prisma', 'PrismaClient'],
    '@prisma/client': ['prisma', 'PrismaClient'],
    'knex': ['knex'],
    'redis': ['redis', 'createClient'],
    'ioredis': ['Redis'],
    'pg': ['Pool', 'Client', 'pg'],
    'mysql2': ['mysql', 'createConnection', 'createPool'],
    'sqlite3': ['sqlite3'],
    'express': ['app', 'express', 'router'],
    'fastify': ['fastify'],
    'koa': ['Koa', 'koa'],
    'hapi': ['Hapi'],
    'axios': ['axios'],
    'node-fetch': ['fetch'],
    'got': ['got'],
    'superagent': ['request'],
    'chalk': ['chalk'],
    'ora': ['ora'],
    'inquirer': ['inquirer'],
    'commander': ['program', 'Command'],
    'yargs': ['yargs'],
    'minimist': ['argv'],
    'dotenv': ['dotenv'],
    'winston': ['winston', 'logger'],
    'pino': ['pino', 'logger'],
    'morgan': ['morgan'],
    'helmet': ['helmet'],
    'cors': ['cors'],
    'compression': ['compression'],
    'body-parser': ['bodyParser'],
    'multer': ['multer', 'upload'],
    'passport': ['passport'],
    'jsonwebtoken': ['jwt'],
    'bcrypt': ['bcrypt'],
    'bcryptjs': ['bcrypt'],
    'crypto-js': ['CryptoJS'],
    'uuid': ['uuid', 'v4', 'uuidv4'],
    'nanoid': ['nanoid'],
    'zod': ['z', 'zod'],
    'joi': ['Joi'],
    'yup': ['yup'],
    'valibot': ['v'],
    'class-validator': ['IsEmail', 'IsString', 'IsNumber'],
    'react': ['React'],
    'react-dom': ['ReactDOM'],
    'vue': ['Vue', 'createApp'],
    'svelte': ['svelte'],
    '@angular/core': ['Component', 'NgModule'],
    'next': ['next'],
    'nuxt': ['nuxt'],
};

function getGitIdentity() {
    const identity = { name: "Developer", author: "Developer", repository: "" };
    try {
        const name = execSync('git config user.name', { encoding: 'utf8', stdio: 'pipe' }).trim();
        const email = execSync('git config user.email', { encoding: 'utf8', stdio: 'pipe' }).trim();
        if (name) {
            identity.name = name;
            identity.author = email ? `${name} <${email}>` : name;
        }
        try {
            const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8', stdio: 'pipe' }).trim();
            identity.repository = remoteUrl.replace(/\.git$/, '');
        } catch (e) {}
    } catch (e) {}
    return identity;
}

function detectPackageManager(targetDir, stats = null) {
    const detectedLockfiles = [];
    if (fs.existsSync(path.join(targetDir, 'pnpm-lock.yaml'))) detectedLockfiles.push('pnpm-lock.yaml');
    if (fs.existsSync(path.join(targetDir, 'yarn.lock'))) detectedLockfiles.push('yarn.lock');
    if (fs.existsSync(path.join(targetDir, 'package-lock.json'))) detectedLockfiles.push('package-lock.json');
    if (fs.existsSync(path.join(targetDir, 'bun.lockb')) || fs.existsSync(path.join(targetDir, 'bun.lock'))) detectedLockfiles.push('bun.lock');

    if (detectedLockfiles.length > 1 && stats) {
        stats.conflictingLockfiles = detectedLockfiles;
    }

    if (detectedLockfiles.some(l => l.startsWith('bun'))) return 'bun';
    if (detectedLockfiles.includes('pnpm-lock.yaml')) return 'pnpm';
    if (detectedLockfiles.includes('yarn.lock')) return 'yarn';
    if (detectedLockfiles.includes('package-lock.json')) return 'npm';

    try { execSync('pnpm --version', { stdio: 'ignore' }); return 'pnpm'; } catch {}
    try { execSync('yarn --version', { stdio: 'ignore' }); return 'yarn'; } catch {}
    return 'npm';
}

function analyzeCodeStyle(content, stats) {
    const lines = content.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;

        if (trimmed.endsWith(';')) stats.style.semiCount++;
        else if (!/[{}:,\[\]]/.test(trimmed.slice(-1))) stats.style.noSemiCount++;

        if (line.startsWith('\t')) stats.style.tabCount++;
        else if (line.startsWith('  ')) {
            const spaces = line.match(/^(\s+)/)?.[1]?.length || 0;
            if (spaces === 2) stats.style.space2Count++;
            if (spaces === 4) stats.style.space4Count++;
        }
    }

    if (REGEX_PATTERNS.legacyVar.test(content)) stats.quality.varCount += (content.match(REGEX_PATTERNS.legacyVar) || []).length;
    if (REGEX_PATTERNS.dangerousEval.test(content)) stats.quality.hasEval = true;
    if (REGEX_PATTERNS.syncFsCalls.test(content)) stats.quality.syncFsCount += (content.match(REGEX_PATTERNS.syncFsCalls) || []).length;
}

function getBinariesFromPackageJson(packageJsonContent) {
    const binaries = new Set();
    if (packageJsonContent && packageJsonContent.scripts) {
        for (const script of Object.values(packageJsonContent.scripts)) {
            const commands = String(script).split(/\s*&&\s*|\s*;\s*|\s*\|\|\s*/);
            for (const cmd of commands) {
                const firstWord = cmd.trim().split(/\s+/)[0];
                if (firstWord && !['npm', 'yarn', 'pnpm', 'bun', 'node', 'npx', 'bunx', 'echo', 'exit', 'cd', 'mkdir', 'rm', 'cp', 'mv', 'cat', 'grep', 'sed', 'awk', 'find', 'sh', 'bash', 'zsh'].includes(firstWord)) {
                    binaries.add(firstWord);
                }
            }
        }
    }
    return Array.from(binaries);
}

function cleanPackageName(importString) {
    if (!importString || /^[./~\\]/.test(importString)) return null;
    if (importString.startsWith('@')) return importString.split('/').slice(0, 2).join('/');
    return importString.split('/')[0];
}

function smartPrepend(originalCode, declarationBlock) {
    const lines = originalCode.split(/\r?\n/);
    let insertIdx = 0;

    while (insertIdx < lines.length) {
        const line = lines[insertIdx].trim();
        if (line.startsWith('#!') || line === '"use strict";' || line === "'use strict';" || line === '`use strict`;') {
            insertIdx++;
        } else if (line === '') {
            insertIdx++;
        } else {
            break;
        }
    }

    lines.splice(insertIdx, 0, declarationBlock);
    return lines.join('\n');
}

async function inspectNpmPackage(pkgName) {
    try {
        const response = await fetch(`https://registry.npmjs.org/${pkgName}/latest`, {
            headers: { 'User-Agent': 'pkg-scaffold-dx-client/2.0' },
            signal: AbortSignal.timeout(4000)
        });
        if (response.status === 200) {
            const data = await response.json();
            return { version: data.version, deprecated: data.deprecated || null, error: null };
        }
        if (response.status === 404) return { version: null, deprecated: null, error: 'NOT_FOUND' };
    } catch (e) {
        return { version: 'latest', deprecated: null, error: 'NETWORK_FAIL' };
    }
    return null;
}

async function fetchRemoteLicense(licenseKey) {
    try {
        const response = await fetch(`https://api.github.com/licenses/${licenseKey.toLowerCase()}`, {
            headers: { 'User-Agent': 'pkg-scaffold-dx-client/2.0' },
            signal: AbortSignal.timeout(5000)
        });
        if (response.status === 200) {
            const data = await response.json();
            return data.body;
        }
    } catch (e) {}
    return null;
}

function readFileSyncNormalized(fullPath) {
    const buffer = fs.readFileSync(fullPath);
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) return buffer.toString('utf16le');
    if (buffer[0] === 0xFE && buffer[1] === 0xFF) return buffer.toString('utf8');
    return buffer.toString('utf8');
}

function buildAsciiTree(dir, prefix = '') {
    const results = [];
    try {
        const files = fs.readdirSync(dir);
        const filtered = files.filter(f => !IGNORED_DIRS.has(f) && !f.startsWith('.'));

        filtered.forEach((file, index) => {
            const isLast = index === filtered.length - 1;
            const marker = isLast ? '└── ' : '├── ';
            results.push(`${prefix}${marker}${file}`);

            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                const newPrefix = prefix + (isLast ? '    ' : '│   ');
                results.push(...buildAsciiTree(fullPath, newPrefix));
            }
        });
    } catch (e) {}
    return results;
}

// ============================================================
// IMPROVED IMPORT EXTRACTION: handles TypeScript generics,
// type-only imports, re-exports, and dynamic imports
// ============================================================
function extractImportsFromAST(ast, fileRawDeps, importedIdentifiers, importedLocations) {
    walk.simple(ast, {
        ImportDeclaration(node) {
            const pkg = cleanPackageName(node.source.value);
            if (pkg && !builtinModules.includes(pkg)) {
                fileRawDeps.add(pkg);
                if (!importedIdentifiers.has(pkg)) importedIdentifiers.set(pkg, new Set());
                if (!importedLocations.has(pkg)) importedLocations.set(pkg, []);
                importedLocations.get(pkg).push(node.loc?.start?.line ?? 0);

                node.specifiers.forEach(spec => {
                    if (spec.type === 'ImportDefaultSpecifier' || spec.type === 'ImportNamespaceSpecifier') {
                        importedIdentifiers.get(pkg).add(spec.local.name);
                    } else if (spec.type === 'ImportSpecifier') {
                        importedIdentifiers.get(pkg).add(spec.local.name);
                        // Also track the imported name (before 'as') for side-effect detection
                        if (spec.imported && spec.imported.name !== spec.local.name) {
                            importedIdentifiers.get(pkg).add(spec.imported.name);
                        }
                    }
                });

                // Side-effect only import: import 'pkg' — always considered "used"
                if (node.specifiers.length === 0) {
                    importedIdentifiers.get(pkg).add('__SIDE_EFFECT__');
                }
            }
        },
        VariableDeclarator(node) {
            if (node.init && node.init.type === 'CallExpression' &&
                node.init.callee.type === 'Identifier' && node.init.callee.name === 'require') {
                const arg = node.init.arguments[0];
                if (arg && arg.type === 'Literal' && typeof arg.value === 'string') {
                    const pkg = cleanPackageName(arg.value);
                    if (pkg && !builtinModules.includes(pkg)) {
                        fileRawDeps.add(pkg);
                        if (!importedIdentifiers.has(pkg)) importedIdentifiers.set(pkg, new Set());
                        if (!importedLocations.has(pkg)) importedLocations.set(pkg, []);
                        importedLocations.get(pkg).push(node.loc?.start?.line ?? 0);

                        const extractBindings = (idNode) => {
                            if (idNode.type === 'Identifier') {
                                importedIdentifiers.get(pkg).add(idNode.name);
                            } else if (idNode.type === 'ObjectPattern') {
                                idNode.properties.forEach(p => {
                                    if (p.value && p.value.type === 'Identifier') importedIdentifiers.get(pkg).add(p.value.name);
                                    if (p.key && p.key.type === 'Identifier') importedIdentifiers.get(pkg).add(p.key.name);
                                });
                            }
                        };
                        extractBindings(node.id);
                    }
                }
            }
        },
        ImportExpression(node) {
            if (node.source.type === 'Literal' && typeof node.source.value === 'string') {
                const pkg = cleanPackageName(node.source.value);
                if (pkg && !builtinModules.includes(pkg)) {
                    fileRawDeps.add(pkg);
                    if (!importedIdentifiers.has(pkg)) importedIdentifiers.set(pkg, new Set());
                    importedIdentifiers.get(pkg).add('__DYNAMIC__');
                }
            }
        },
        ExportNamedDeclaration(node) {
            if (node.source && node.source.type === 'Literal' && typeof node.source.value === 'string') {
                const pkg = cleanPackageName(node.source.value);
                if (pkg && !builtinModules.includes(pkg)) {
                    fileRawDeps.add(pkg);
                    if (!importedIdentifiers.has(pkg)) importedIdentifiers.set(pkg, new Set());
                    importedIdentifiers.get(pkg).add('__REEXPORT__');
                }
            }
        },
        ExportAllDeclaration(node) {
            if (node.source && node.source.type === 'Literal' && typeof node.source.value === 'string') {
                const pkg = cleanPackageName(node.source.value);
                if (pkg && !builtinModules.includes(pkg)) {
                    fileRawDeps.add(pkg);
                    if (!importedIdentifiers.has(pkg)) importedIdentifiers.set(pkg, new Set());
                    importedIdentifiers.get(pkg).add('__REEXPORT__');
                }
            }
        }
    });
}

// ============================================================
// REGEX FALLBACK: handles TypeScript files that acorn can't parse
// ============================================================
function extractImportsFromText(codeLines, fileRawDeps, importedIdentifiers, importedLocations) {
    codeLines.forEach((line, lineIdx) => {
        const lineNum = lineIdx + 1;

        // import type { ... } from '...' — type-only, mark as side-effect
        const typeImportMatch = line.match(/\bimport\s+type\s+\{[^}]*\}\s+from\s+['"]([^'"]+)['"]/);
        if (typeImportMatch) {
            const pkg = cleanPackageName(typeImportMatch[1]);
            if (pkg && !builtinModules.includes(pkg)) {
                fileRawDeps.add(pkg);
                if (!importedIdentifiers.has(pkg)) importedIdentifiers.set(pkg, new Set());
                importedIdentifiers.get(pkg).add('__TYPE_ONLY__');
                if (!importedLocations.has(pkg)) importedLocations.set(pkg, []);
                importedLocations.get(pkg).push(lineNum);
            }
            return;
        }

        // import DefaultExport from '...'
        // import * as Namespace from '...'
        const esmDefaultMatch = line.match(/\bimport\s+(?:\*\s+as\s+)?([a-zA-Z0-9_$]+)\s+from\s+['"]([^'"]+)['"]/);
        if (esmDefaultMatch) {
            const id = esmDefaultMatch[1];
            const pkg = cleanPackageName(esmDefaultMatch[2]);
            if (pkg && !builtinModules.includes(pkg)) {
                fileRawDeps.add(pkg);
                if (!importedIdentifiers.has(pkg)) importedIdentifiers.set(pkg, new Set());
                importedIdentifiers.get(pkg).add(id);
                if (!importedLocations.has(pkg)) importedLocations.set(pkg, []);
                importedLocations.get(pkg).push(lineNum);
            }
            return;
        }

        // import { named, exports } from '...'
        const esmNamedMatch = line.match(/\bimport\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/);
        if (esmNamedMatch) {
            const pkg = cleanPackageName(esmNamedMatch[2]);
            if (pkg && !builtinModules.includes(pkg)) {
                if (!importedIdentifiers.has(pkg)) importedIdentifiers.set(pkg, new Set());
                fileRawDeps.add(pkg);
                esmNamedMatch[1].split(',').forEach(part => {
                    const chunk = part.trim();
                    if (!chunk) return;
                    const id = chunk.includes(' as ') ? chunk.split(' as ')[1].trim() : chunk;
                    importedIdentifiers.get(pkg).add(id);
                    // Also add the original name
                    if (chunk.includes(' as ')) importedIdentifiers.get(pkg).add(chunk.split(' as ')[0].trim());
                });
                if (!importedLocations.has(pkg)) importedLocations.set(pkg, []);
                importedLocations.get(pkg).push(lineNum);
            }
            return;
        }

        // Side-effect only: import '...'
        const sideEffectMatch = line.match(/\bimport\s+['"]([^'"]+)['"]/);
        if (sideEffectMatch) {
            const pkg = cleanPackageName(sideEffectMatch[1]);
            if (pkg && !builtinModules.includes(pkg)) {
                fileRawDeps.add(pkg);
                if (!importedIdentifiers.has(pkg)) importedIdentifiers.set(pkg, new Set());
                importedIdentifiers.get(pkg).add('__SIDE_EFFECT__');
                if (!importedLocations.has(pkg)) importedLocations.set(pkg, []);
                importedLocations.get(pkg).push(lineNum);
            }
            return;
        }

        // const x = require('...')
        const cjsMatch = line.match(/\b(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
        if (cjsMatch) {
            const id = cjsMatch[1];
            const pkg = cleanPackageName(cjsMatch[2]);
            if (pkg && !builtinModules.includes(pkg)) {
                fileRawDeps.add(pkg);
                if (!importedIdentifiers.has(pkg)) importedIdentifiers.set(pkg, new Set());
                importedIdentifiers.get(pkg).add(id);
                if (!importedLocations.has(pkg)) importedLocations.set(pkg, []);
                importedLocations.get(pkg).push(lineNum);
            }
            return;
        }

        // const { a, b } = require('...')
        const cjsDestructMatch = line.match(/\b(?:const|let|var)\s*\{([^}]+)\}\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
        if (cjsDestructMatch) {
            const pkg = cleanPackageName(cjsDestructMatch[2]);
            if (pkg && !builtinModules.includes(pkg)) {
                if (!importedIdentifiers.has(pkg)) importedIdentifiers.set(pkg, new Set());
                fileRawDeps.add(pkg);
                cjsDestructMatch[1].split(',').forEach(part => {
                    const chunk = part.trim();
                    if (!chunk) return;
                    const id = chunk.includes(':') ? chunk.split(':')[1].trim() : chunk;
                    importedIdentifiers.get(pkg).add(id);
                });
                if (!importedLocations.has(pkg)) importedLocations.set(pkg, []);
                importedLocations.get(pkg).push(lineNum);
            }
            return;
        }

        // Dynamic import: import('...')
        const dynamicMatch = line.match(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/);
        if (dynamicMatch) {
            const pkg = cleanPackageName(dynamicMatch[1]);
            if (pkg && !builtinModules.includes(pkg)) {
                fileRawDeps.add(pkg);
                if (!importedIdentifiers.has(pkg)) importedIdentifiers.set(pkg, new Set());
                importedIdentifiers.get(pkg).add('__DYNAMIC__');
                if (!importedLocations.has(pkg)) importedLocations.set(pkg, []);
                importedLocations.get(pkg).push(lineNum);
            }
        }
    });
}

// ============================================================
// USAGE ANALYSIS: determines if imported identifiers are
// actually referenced in the non-import code body
// ============================================================
function analyzeIdentifierUsage(pkg, identifiers, executionCode) {
    // Always-used markers: side-effect, dynamic, re-export, type-only
    const autoUsedMarkers = new Set(['__SIDE_EFFECT__', '__DYNAMIC__', '__REEXPORT__', '__TYPE_ONLY__']);
    for (const id of identifiers) {
        if (autoUsedMarkers.has(id)) return true;
    }

    // Check known aliases for this package
    const knownAliases = PACKAGE_IMPORT_ALIASES[pkg] || [];

    for (const identifier of identifiers) {
        if (!identifier || identifier.startsWith('__')) continue;
        // Escape special regex chars in identifier
        const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const usagePattern = new RegExp(`\\b${escaped}\\b`);
        if (usagePattern.test(executionCode)) return true;
    }

    // Check if any known alias for this package appears in the code
    for (const alias of knownAliases) {
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const aliasPattern = new RegExp(`\\b${escaped}\\b`);
        if (aliasPattern.test(executionCode)) return true;
    }

    return false;
}

// ============================================================
// GHOST DEPENDENCY DETECTOR
// Finds packages used in code but NOT declared in package.json
// This is the most critical error: will fail at runtime/deploy
// ============================================================
function detectGhostDependencies(allImportedPackages, declaredDeps, declaredDevDeps) {
    const allDeclared = new Set([...declaredDeps, ...declaredDevDeps]);
    const ghosts = new Set();

    for (const pkg of allImportedPackages) {
        if (!allDeclared.has(pkg) && !builtinModules.includes(pkg)) {
            ghosts.add(pkg);
        }
    }
    return ghosts;
}

// ============================================================
// ORPHANED DEPENDENCY DETECTOR
// Finds packages in package.json that are never imported anywhere
// in the codebase (candidates for removal)
// ============================================================
function detectOrphanedDependencies(declaredDeps, allImportedPackages, binariesUsed, devTooling) {
    const orphans = new Set();

    for (const dep of declaredDeps) {
        // Skip dev tooling — they're used via CLI, not imports
        if (devTooling.has(dep) || dep.startsWith('@types/')) continue;

        // Check if it's used as a binary
        const binaryPkg = Object.values(BINARY_TO_PACKAGE_MAP).find(p => p === dep);
        if (binaryPkg && binariesUsed.has(dep)) continue;

        // Check if it's imported anywhere
        if (!allImportedPackages.has(dep)) {
            orphans.add(dep);
        }
    }
    return orphans;
}

// ============================================================
// HIGH PERFORMANCE AST WORKSPACE PARSING ENGINE
// ============================================================
function scanWorkspace(dir, stats, rootNamespace) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!IGNORED_DIRS.has(file) && !file.startsWith('.')) {
                scanWorkspace(fullPath, stats, rootNamespace);
            }
        } else {
            const ext = path.extname(file);

            if (file === 'index.html' || REGEX_PATTERNS.configFile.test(file)) stats.hasHtml = true;
            if (REGEX_PATTERNS.testFile.test(file)) stats.hasTests = true;
            if (ext === '.ts' || ext === '.tsx') stats.tsFiles++;
            if (ext === '.js' || ext === '.jsx' || ext === '.mjs') stats.jsFiles++;

            if (VALID_EXTENSIONS.has(ext)) {
                stats.scannedFiles++;
                const rawContent = readFileSyncNormalized(fullPath);
                // Strip non-printable chars but keep Unicode letters (important for identifiers)
                const content = rawContent.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

                const codeLines = content.split(/\r?\n/);
                const importedIdentifiers = new Map();
                const importedLocations = new Map();
                const fileRawDeps = new Set();

                analyzeCodeStyle(content, stats);

                // Universal Cryptographic Leak Interception
                REGEX_PATTERNS.secretKeys.lastIndex = 0;
                let secretMatch;
                while ((secretMatch = REGEX_PATTERNS.secretKeys.exec(content)) !== null) {
                    const keyName = secretMatch[1];
                    const secretValue = secretMatch[2];
                    const envVarName = `${rootNamespace.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${keyName.toUpperCase()}`;
                    stats.discoveredSecrets.push({ filePath: fullPath, keyName, secretValue, envVarName });
                    stats.envVars.add(envVarName);
                }

                // Global Regex Environmental Extraction Module
                let fileHasEnv = false;
                let envMatch;
                REGEX_PATTERNS.env.lastIndex = 0;
                while ((envMatch = REGEX_PATTERNS.env.exec(content)) !== null) {
                    stats.envVars.add(envMatch[1]);
                    fileHasEnv = true;
                }
                if (fileHasEnv) stats.filesWithEnvVars.add(fullPath);

                if (content.includes('import ') || content.includes('export ')) stats.usesEsm = true;

                // --- AST Parsing (preferred) ---
                let ast = null;
                try {
                    ast = acorn.parse(content, { ecmaVersion: 'latest', sourceType: 'module', allowHashBang: true, locations: true });
                } catch (e) {
                    try {
                        ast = acorn.parse(content, { ecmaVersion: 'latest', sourceType: 'script', allowHashBang: true, locations: true });
                    } catch (err) {}
                }

                if (ast) {
                    extractImportsFromAST(ast, fileRawDeps, importedIdentifiers, importedLocations);
                } else {
                    // Regex fallback for TypeScript generics / decorators / etc.
                    extractImportsFromText(codeLines, fileRawDeps, importedIdentifiers, importedLocations);
                }

                // Register all deps found in this file
                fileRawDeps.forEach(dep => stats.allImportedPackages.add(dep));
                fileRawDeps.forEach(dep => stats.rawDeps.add(dep));

                // --- Per-file usage analysis ---
                // Strip import/require lines to get only execution code
                const executionCode = codeLines
                    .filter(l => {
                        const t = l.trim();
                        return !t.startsWith('import ') && !/\brequire\s*\(/.test(t);
                    })
                    .join('\n');

                for (const [pkg, identifiers] of importedIdentifiers.entries()) {
                    const isUsed = analyzeIdentifierUsage(pkg, identifiers, executionCode);
                    if (!isUsed && identifiers.size > 0) {
                        if (!stats.unusedImportsPerFile.has(fullPath)) {
                            stats.unusedImportsPerFile.set(fullPath, new Map());
                        }
                        const lines = importedLocations.get(pkg) || [];
                        stats.unusedImportsPerFile.get(fullPath).set(pkg, lines);
                        stats.unusedDepsInCode.add(pkg);
                    }
                }
            }
        }
    }
}

async function main() {
    const targetDir = process.cwd();
    const folderName = path.basename(targetDir);
    const gitInfo = getGitIdentity();

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    let rlClosed = false;
    rl.on('close', () => { rlClosed = true; });
    const safeQuestion = async (prompt) => {
        if (rlClosed || !process.stdin.readable) return '';
        try { return await safeQuestion(prompt); } catch { return ''; }
    };

    const stats = {
        tsFiles: 0, jsFiles: 0, usesEsm: false, hasHtml: false, hasTests: false,
        scannedFiles: 0,
        rawDeps: new Set(),
        allImportedPackages: new Set(),
        envVars: new Set(),
        style: { semiCount: 0, noSemiCount: 0, tabCount: 0, space2Count: 0, space4Count: 0 },
        quality: { varCount: 0, hasEval: false, syncFsCount: 0 },
        phantomInjections: new Map(),
        discoveredSecrets: [],
        subWorkspaces: [],
        conflictingLockfiles: [],
        unusedDepsInCode: new Set(),
        unusedImportsPerFile: new Map(),
        filesWithEnvVars: new Set(),
        injectDotenvEngine: false,
        bootstrapEslintSuite: false,
        // New tracking structures
        ghostDependencies: new Set(),    // used in code, missing from package.json
        orphanedDependencies: new Set(), // in package.json, never imported
        deprecatedPackages: new Map(),   // pkg -> deprecation message
    };

    const activePkgManager = detectPackageManager(targetDir, stats);
    const pkgPath = path.join(targetDir, 'package.json');
    let preExistingLicense = null;
    let preExistingDeps = [];
    let preExistingDevDeps = [];
    let existingPackageJson = null;

    console.log(`\n${'═'.repeat(67)}`);
    console.log(`🚀 pkg-scaffold v2.0: Advanced Dependency Intelligence Engine`);
    console.log(`${'═'.repeat(67)}\n`);

    // --- Sub-workspace detection ---
    const topLevelItems = fs.readdirSync(targetDir);
    const potentialSubModules = [];
    for (const item of topLevelItems) {
        const fullPath = path.join(targetDir, item);
        if (!IGNORED_DIRS.has(item) && !item.startsWith('.') && fs.statSync(fullPath).isDirectory()) {
            let containsSourceCode = false;
            const examineDirectory = (d) => {
                try {
                    const subEntries = fs.readdirSync(d);
                    for (const entry of subEntries) {
                        const entryPath = path.join(d, entry);
                        if (fs.statSync(entryPath).isDirectory()) {
                            if (!IGNORED_DIRS.has(entry) && !entry.startsWith('.')) examineDirectory(entryPath);
                        } else if (VALID_EXTENSIONS.has(path.extname(entry))) {
                            containsSourceCode = true;
                        }
                    }
                } catch {}
            };
            examineDirectory(fullPath);
            if (containsSourceCode) potentialSubModules.push(item);
        }
    }
    if (potentialSubModules.length > 1) stats.subWorkspaces = potentialSubModules;

    // --- Existing package.json analysis ---
    if (fs.existsSync(pkgPath)) {
        console.log(`⚠️  An existing package.json was found in this working directory.`);
        console.log(`📡 Analyzing existing installation arrays for invalid metrics...`);
        try {
            existingPackageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            if (existingPackageJson.license && typeof existingPackageJson.license === 'string' && existingPackageJson.license.toLowerCase() !== 'none') {
                preExistingLicense = existingPackageJson.license;
            }
            if (existingPackageJson.dependencies) preExistingDeps = Object.keys(existingPackageJson.dependencies);
            if (existingPackageJson.devDependencies) preExistingDevDeps = Object.keys(existingPackageJson.devDependencies);

            const combinedDeps = [...preExistingDeps, ...preExistingDevDeps];
            let brokenEcosystem = combinedDeps.length === 0;

            // Check for non-existent AND deprecated packages
            if (combinedDeps.length > 0) {
                console.log(`   🔍 Validating ${combinedDeps.length} declared package(s) against npm registry...`);
                for (const dep of combinedDeps) {
                    const check = await inspectNpmPackage(dep);
                    if (check && check.error === 'NOT_FOUND') {
                        brokenEcosystem = true;
                        console.log(`   ❌ Non-existent package on registry: "${dep}"`);
                    } else if (check && check.deprecated) {
                        stats.deprecatedPackages.set(dep, check.deprecated);
                        console.log(`   ⚠️  Deprecated package detected: "${dep}" — ${check.deprecated}`);
                    }
                }
            }

            if (brokenEcosystem) {
                console.log(`\n🛑 CRITICAL COMPLIANCE BREAK: Your current package.json is empty or contains non-existent packages.`);
                console.log(`👉 Action Required: Please remove or backup the existing 'package.json' from this folder.\n`);
                rl.close();
                return;
            }
        } catch (err) {
            console.log(`\n🛑 CRITICAL: Existing package.json is malformed or corrupt.\n`);
            rl.close();
            return;
        }
    }

    // --- Workspace scan ---
    console.log(`\n🔬 Scanning workspace source files...`);
    scanWorkspace(targetDir, stats, folderName);
    console.log(`   ✅ Scanned ${stats.scannedFiles} source file(s) | TS: ${stats.tsFiles} | JS: ${stats.jsFiles}`);

    // --- Binary-to-package resolution ---
    const binariesInScripts = existingPackageJson ? getBinariesFromPackageJson(existingPackageJson) : [];
    const resolvedBinaryPackages = new Set();
    for (const binary of binariesInScripts) {
        const pkgName = BINARY_TO_PACKAGE_MAP[binary] || binary;
        resolvedBinaryPackages.add(pkgName);
        stats.rawDeps.add(pkgName);
        stats.allImportedPackages.add(pkgName); // treat as "used"
    }

    // ============================================================
    // GHOST DEPENDENCY ANALYSIS
    // Packages imported in code but missing from package.json
    // ============================================================
    if (preExistingDeps.length > 0 || preExistingDevDeps.length > 0) {
        stats.ghostDependencies = detectGhostDependencies(
            stats.allImportedPackages,
            preExistingDeps,
            preExistingDevDeps
        );
        // Remove dev tooling from ghost list (they may be globally installed)
        for (const dep of stats.ghostDependencies) {
            if (DEV_TOOLING_ECOSYSTEM.has(dep) || dep.startsWith('@types/')) {
                stats.ghostDependencies.delete(dep);
            }
        }
    }

    // ============================================================
    // ORPHANED DEPENDENCY ANALYSIS
    // Packages in package.json that are never imported
    // ============================================================
    if (preExistingDeps.length > 0) {
        stats.orphanedDependencies = detectOrphanedDependencies(
            preExistingDeps,
            stats.allImportedPackages,
            resolvedBinaryPackages,
            DEV_TOOLING_ECOSYSTEM
        );
    }

    // ============================================================
    // UNUSED IMPORTS ANALYSIS (cross-file aggregation)
    // A package is only truly "unused" if it's never used in ANY file
    // ============================================================
    // Build a set of packages that ARE used in at least one file
    const usedInAtLeastOneFile = new Set();
    for (const [, fileImports] of stats.unusedImportsPerFile.entries()) {
        // If a package appears in unusedImportsPerFile for this file,
        // it might still be used in another file — check allImportedPackages
    }
    // Refine: unusedDepsInCode should only include packages that are
    // imported but never referenced across the entire codebase
    const trulyUnusedImports = new Set();
    for (const pkg of stats.unusedDepsInCode) {
        // If the package is used (identifier found) in ANY file, remove from unused
        let foundUsedElsewhere = false;
        for (const [filePath, fileUnused] of stats.unusedImportsPerFile.entries()) {
            if (!fileUnused.has(pkg)) {
                // This file imports pkg and DOES use it
                if (stats.allImportedPackages.has(pkg)) {
                    foundUsedElsewhere = true;
                    break;
                }
            }
        }
        if (!foundUsedElsewhere) trulyUnusedImports.add(pkg);
    }

    // ============================================================
    // DISPLAY: GHOST DEPENDENCIES (critical — will break at runtime)
    // ============================================================
    if (stats.ghostDependencies.size > 0) {
        console.log(`\n${'─'.repeat(67)}`);
        console.log(`🚨 GHOST DEPENDENCIES DETECTED (CRITICAL — Runtime/Deploy will FAIL)`);
        console.log(`${'─'.repeat(67)}`);
        console.log(`   These packages are USED in your code but NOT listed in package.json.`);
        console.log(`   They may work locally (if globally installed) but WILL FAIL in CI/CD.\n`);
        for (const pkg of stats.ghostDependencies) {
            console.log(`   ❌ \x1b[31m"${pkg}"\x1b[0m — imported in code, missing from package.json`);
        }
        console.log(`${'─'.repeat(67)}`);
        const addGhosts = await safeQuestion(`❓ Add these missing packages to package.json automatically? (Y/n): `);
        if (addGhosts.trim().toLowerCase() !== 'n' && addGhosts.trim().toLowerCase() !== 'no') {
            for (const pkg of stats.ghostDependencies) stats.rawDeps.add(pkg);
            console.log(`   ✅ Ghost dependencies queued for package.json registration.`);
        }
    }

    // ============================================================
    // DISPLAY: ORPHANED DEPENDENCIES (in package.json, never used)
    // ============================================================
    if (stats.orphanedDependencies.size > 0) {
        console.log(`\n${'─'.repeat(67)}`);
        console.log(`📦 ORPHANED DEPENDENCIES DETECTED (in package.json, never imported)`);
        console.log(`${'─'.repeat(67)}`);
        console.log(`   These packages are declared in package.json but never imported`);
        console.log(`   anywhere in your source code. Safe to remove.\n`);
        for (const pkg of stats.orphanedDependencies) {
            console.log(`   🗑️  \x1b[33m"${pkg}"\x1b[0m — declared but never imported`);
        }
        console.log(`${'─'.repeat(67)}`);
        const pruneOrphans = await safeQuestion(`❓ Remove these orphaned packages from package.json? (y/N): `);
        if (pruneOrphans.trim().toLowerCase() === 'y' || pruneOrphans.trim().toLowerCase() === 'yes') {
            if (existingPackageJson) {
                for (const pkg of stats.orphanedDependencies) {
                    delete existingPackageJson.dependencies?.[pkg];
                }
                fs.writeFileSync(pkgPath, JSON.stringify(existingPackageJson, null, 2));
                console.log(`   🗑️  Orphaned dependencies removed from package.json.`);
            }
        }
    }

    // ============================================================
    // DISPLAY: UNUSED IMPORTS (imported but never referenced in code)
    // ============================================================
    const allDiscoveredUnused = new Set([...trulyUnusedImports]);
    // Also add packages in package.json not found in code at all
    if (preExistingDeps.length > 0) {
        preExistingDeps.forEach(dep => {
            if (!stats.rawDeps.has(dep) && !DEV_TOOLING_ECOSYSTEM.has(dep) && !dep.startsWith('@types/')) {
                allDiscoveredUnused.add(dep);
            }
        });
    }
    // Remove dev tooling from unused list
    for (const dep of allDiscoveredUnused) {
        if (DEV_TOOLING_ECOSYSTEM.has(dep) || dep.startsWith('@types/')) {
            allDiscoveredUnused.delete(dep);
        }
    }

    if (allDiscoveredUnused.size > 0) {
        console.log(`\n${'─'.repeat(67)}`);
        console.log(`⚠️  UNUSED IMPORTS DETECTED (imported but never referenced in code)`);
        console.log(`${'─'.repeat(67)}`);
        console.log(`   These modules are imported but their identifiers are never used`);
        console.log(`   in executable code paths.\n`);

        for (const dep of allDiscoveredUnused) {
            // Show which files have this unused import
            const filesWithUnused = [];
            for (const [filePath, fileUnused] of stats.unusedImportsPerFile.entries()) {
                if (fileUnused.has(dep)) {
                    const lines = fileUnused.get(dep);
                    const lineStr = lines.length > 0 ? `:${lines[0]}` : '';
                    filesWithUnused.push(`${path.relative(targetDir, filePath)}${lineStr}`);
                }
            }
            if (filesWithUnused.length > 0) {
                console.log(`   ⚡ \x1b[33m"${dep}"\x1b[0m`);
                filesWithUnused.forEach(f => console.log(`      └─ ${f}`));
            } else {
                console.log(`   ⚡ \x1b[33m"${dep}"\x1b[0m`);
            }
        }
        console.log(`${'─'.repeat(67)}`);

        const pruneChoice = await safeQuestion(`❓ Exclude these unused imports from your package.json setup? (y/N): `);
        if (pruneChoice.trim().toLowerCase() === 'y' || pruneChoice.trim().toLowerCase() === 'yes') {
            for (const deadDep of allDiscoveredUnused) stats.rawDeps.delete(deadDep);
            console.log(`   🗑️  Pruned unused imports from configuration blueprint.`);
        }
    }

    // ============================================================
    // DISPLAY: DEPRECATED PACKAGES
    // ============================================================
    if (stats.deprecatedPackages.size > 0) {
        console.log(`\n${'─'.repeat(67)}`);
        console.log(`⚠️  DEPRECATED PACKAGES DETECTED`);
        console.log(`${'─'.repeat(67)}`);
        for (const [pkg, msg] of stats.deprecatedPackages.entries()) {
            console.log(`   📛 \x1b[33m"${pkg}"\x1b[0m — ${msg}`);
        }
        console.log(`${'─'.repeat(67)}`);
    }

    // ============================================================
    // PHANTOM INJECTION DETECTION
    // Packages used in code (by identifier) but never imported
    // ============================================================
    // Build phantom detection from ALL declared packages
    const allDeclaredForPhantom = new Set([...preExistingDeps, ...preExistingDevDeps]);
    for (const [filePath] of stats.unusedImportsPerFile.entries()) {
        // Already handled above
    }

    // Scan for identifiers used without import (using declared package names as hints)
    const phantomScanContent = new Map();
    function collectExecutionContent(dir) {
        try {
            for (const file of fs.readdirSync(dir)) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory() && !IGNORED_DIRS.has(file) && !file.startsWith('.')) {
                    collectExecutionContent(fullPath);
                } else if (VALID_EXTENSIONS.has(path.extname(file))) {
                    try {
                        const content = readFileSyncNormalized(fullPath);
                        const execCode = content.split(/\r?\n/)
                            .filter(l => {
                                const t = l.trim();
                                return !t.startsWith('import ') && !/\brequire\s*\(/.test(t);
                            })
                            .join('\n');
                        phantomScanContent.set(fullPath, execCode);
                    } catch {}
                }
            }
        } catch {}
    }
    collectExecutionContent(targetDir);

    for (const [filePath, execCode] of phantomScanContent.entries()) {
        for (const token of allDeclaredForPhantom) {
            const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const tokenPattern = new RegExp(`\\b${escaped}\\b`);
            if (tokenPattern.test(execCode) && !stats.allImportedPackages.has(token)) {
                stats.rawDeps.add(token);
                if (!stats.phantomInjections.has(filePath)) stats.phantomInjections.set(filePath, new Set());
                stats.phantomInjections.get(filePath).add(token);
            }
        }
    }

    const isTypeScript = stats.tsFiles > stats.jsFiles;
    const isFrontendWeb = stats.hasHtml || stats.rawDeps.has('react') || stats.rawDeps.has('vue') || stats.rawDeps.has('vite') || stats.rawDeps.has('svelte') || stats.rawDeps.has('next') || stats.rawDeps.has('nuxt');

    // --- dotenv suggestion ---
    if (stats.envVars.size > 0 && !stats.rawDeps.has('dotenv') && !isFrontendWeb) {
        console.log(`\n📡 CONFIGURATION COMPLIANCE GAP: UNMANAGED ENVIRONMENT VARIABLES`);
        console.log(`${'─'.repeat(67)}`);
        console.log(`  Workspace utilizes 'process.env' variables but 'dotenv' is missing.`);
        console.log(`${'─'.repeat(67)}`);
        const choiceEnv = await safeQuestion(`❓ Add 'dotenv' and automatically wire initialization hooks into your files? (Y/n): `);
        if (choiceEnv.trim().toLowerCase() !== 'n' && choiceEnv.trim().toLowerCase() !== 'no') {
            stats.rawDeps.add('dotenv');
            stats.injectDotenvEngine = true;
        }
    }

    // --- Build package.json ---
    const packageJson = {
        name: folderName.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
        version: '1.0.0',
        description: `Automated ${isFrontendWeb ? 'frontend layout application' : 'backend infrastructure runtime'}.`,
        type: (stats.usesEsm || isTypeScript || isFrontendWeb) ? 'module' : 'commonjs',
        author: gitInfo.author || undefined,
        repository: gitInfo.repository ? { type: "git", url: `git+${gitInfo.repository}.git` } : undefined,
        scripts: { test: stats.hasTests ? (isFrontendWeb ? 'vitest' : 'jest') : 'echo "No workspace test vectors specified" && exit 0' },
        dependencies: {},
        devDependencies: {}
    };

    // --- ESLint suggestion ---
    const eslintConfigFile = path.join(targetDir, 'eslint.config.js');
    const linterPresent = fs.existsSync(eslintConfigFile) || fs.existsSync(path.join(targetDir, '.eslintrc.json')) || fs.existsSync(path.join(targetDir, '.eslintrc.js'));

    if (!linterPresent && (stats.quality.varCount > 0 || stats.quality.hasEval || stats.phantomInjections.size > 0)) {
        console.log(`\n🎨 QUALITY LAYER AUDITOR: SYNTAX VALIDATION SYSTEM REQUIRED`);
        console.log(`${'─'.repeat(67)}`);
        console.log(`  Code anomalies (legacy 'var' or 'eval()') require static linter guards.`);
        console.log(`${'─'.repeat(67)}`);
        const choiceLintSetup = await safeQuestion(`❓ Bootstrap standard ESLint flat verification rules into workspace? (Y/n): `);
        if (choiceLintSetup.trim().toLowerCase() !== 'n' && choiceLintSetup.trim().toLowerCase() !== 'no') {
            stats.bootstrapEslintSuite = true;
            stats.rawDeps.add('eslint');
            if (isTypeScript) stats.rawDeps.add('typescript-eslint');
            else stats.rawDeps.add('@eslint/js');
        }
    }

    if (isFrontendWeb) {
        packageJson.scripts.dev = 'vite';
        packageJson.scripts.build = 'vite build';
        packageJson.scripts.preview = 'vite preview';
        stats.rawDeps.add('vite');
        if (stats.hasTests) stats.rawDeps.add('vitest');
    } else {
        if (isTypeScript) {
            packageJson.scripts.build = 'tsc';
            packageJson.scripts.start = 'node dist/index.js';
            packageJson.scripts.dev = 'node --watch dist/index.js';
        } else {
            packageJson.scripts.start = 'node index.js';
        }
    }

    if (isTypeScript) {
        packageJson.devDependencies.typescript = '^5.4.0';
        if (!isFrontendWeb) packageJson.devDependencies['@types/node'] = '^20.11.0';
    }

    // --- Resolve package versions from npm ---
    if (stats.rawDeps.size > 0) {
        console.log(`\n📡 Resolving baseline package registry definitions...`);
        for (const pkg of stats.rawDeps) {
            const cleaned = cleanPackageName(pkg);
            if (cleaned && !builtinModules.includes(cleaned)) {
                const check = await inspectNpmPackage(cleaned);
                if (check && check.error !== 'NOT_FOUND') {
                    const version = check.version || 'latest';

                    const isDevDep = [
                        'vite', 'vitest', 'typescript', 'eslint', 'typescript-eslint',
                        '@eslint/js', 'prettier', 'jest', 'nodemon', 'ts-node', 'tsup',
                        'esbuild', '@swc/cli', 'tsx', 'rimraf', 'copyfiles', 'mkdirp',
                        'husky', 'lint-staged', '@commitlint/cli', 'typedoc', 'c8', 'nyc',
                        'mocha', 'ava', 'tap', 'jasmine', 'storybook', 'turbo', 'nx',
                        'biome', '@biomejs/biome', 'oxlint', 'xo', 'standard',
                    ].includes(cleaned) || cleaned.startsWith('@types/');

                    if (isDevDep) packageJson.devDependencies[cleaned] = `^${version}`;
                    else packageJson.dependencies[cleaned] = `^${version}`;
                    console.log(`   ✔ Synced: ${cleaned}@^${version}${check.deprecated ? ' \x1b[33m[DEPRECATED]\x1b[0m' : ''}`);
                }
            }
        }
    }

    // --- Phantom injection report ---
    if (stats.phantomInjections.size > 0) {
        console.log(`\n${'─'.repeat(67)}`);
        console.log(`👻 PHANTOM STRUCTURE ALERT: UNIMPORTED EXECUTIONS DETECTED`);
        console.log(`${'─'.repeat(67)}`);
        for (const [filePath, missingModules] of stats.phantomInjections.entries()) {
            console.log(`📂 File: ${path.relative(targetDir, filePath)}`);
            console.log(`   ❌ Used but never imported: ${Array.from(missingModules).map(m => `"${m}"`).join(', ')}`);
        }
        console.log(`${'─'.repeat(67)}`);
    }

    // --- Code quality warnings ---
    if (stats.quality.varCount > 0 || stats.quality.hasEval || stats.quality.syncFsCount > 0) {
        console.log(`\n⚠️  CODE ARCHITECTURE & MODERNIZATION COMPLIANCE WARNINGS:`);
        console.log(`${'─'.repeat(67)}`);
        if (stats.quality.varCount > 0) console.log(`   ⚡ Found ${stats.quality.varCount} instances of legacy 'var'. Transition to 'let' / 'const'.`);
        if (stats.quality.hasEval) console.log(`   🔥 DANGER: 'eval()' detected! Refactor to mitigate remote code execution vectors.`);
        if (stats.quality.syncFsCount > 0) console.log(`   📉 Performance: Found ${stats.quality.syncFsCount} synchronous fs calls. Transition to 'fs/promises'.`);
        console.log(`${'─'.repeat(67)}`);
    }

    // --- Security: hardcoded secrets ---
    if (stats.discoveredSecrets.length > 0) {
        console.log(`\n🚨 CRITICAL SECURITY COMPLIANCE ALERT: HARDCODED CREDENTIALS DETECTED`);
        console.log(`${'─'.repeat(67)}`);
        for (const secretMeta of stats.discoveredSecrets) {
            console.log(`📂 File: ${path.relative(targetDir, secretMeta.filePath)}`);
            console.log(`   ⚠️  Hardcoded credential found: [${secretMeta.keyName}]`);
        }
        console.log(`${'─'.repeat(67)}`);

        const fixSecrets = await safeQuestion(`❓ Automatically extract credentials into environment mappings safely? (y/N): `);
        if (fixSecrets.trim().toLowerCase() === 'y' || fixSecrets.trim().toLowerCase() === 'yes') {
            const envPath = path.join(targetDir, '.env');
            let envBuffer = fs.existsSync(envPath) ? readFileSyncNormalized(envPath) : '';

            for (const secretMeta of stats.discoveredSecrets) {
                let currentCodeContent = readFileSyncNormalized(secretMeta.filePath);
                const envAccessor = isFrontendWeb ? `import.meta.env.${secretMeta.envVarName}` : `process.env.${secretMeta.envVarName}`;
                const exactLiteralPattern = new RegExp(`\\b${secretMeta.keyName}\\s*=\\s*['"\`]${secretMeta.secretValue.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}['"\`]`, 'g');
                currentCodeContent = currentCodeContent.replace(exactLiteralPattern, `${secretMeta.keyName} = ${envAccessor}`);
                fs.writeFileSync(secretMeta.filePath, currentCodeContent);
                if (!envBuffer.includes(`${secretMeta.envVarName}=`)) envBuffer += `${secretMeta.envVarName}=${secretMeta.secretValue}\n`;
                console.log(`   🔒 Isolated: ${secretMeta.keyName} → ${envAccessor}`);
            }
            fs.writeFileSync(envPath, envBuffer);
        }
    }

    // --- Monorepo detection ---
    if (stats.subWorkspaces && stats.subWorkspaces.length > 1) {
        console.log(`\n📂 MULTI-WORKSPACE SEGMENTATION DETECTED`);
        console.log(`   Identified sub-module paths: ${stats.subWorkspaces.map(w => `/${w}`).join(', ')}`);
        const setupWorkspace = await safeQuestion(`❓ Setup as a multi-package Monorepo Workspace layout? (y/N): `);
        if (setupWorkspace.trim().toLowerCase() === 'y' || setupWorkspace.trim().toLowerCase() === 'yes') {
            if (activePkgManager === 'pnpm') {
                const workspaceYamlPath = path.join(targetDir, 'pnpm-workspace.yaml');
                fs.writeFileSync(workspaceYamlPath, `packages:\n${stats.subWorkspaces.map(w => `  - '${w}'`).join('\n')}\n`);
                console.log(`   🏗️  Generated: pnpm-workspace.yaml`);
            } else {
                packageJson.workspaces = stats.subWorkspaces;
                console.log(`   🏗️  Injected 'workspaces' into root package.json.`);
            }
        }
    }

    // --- License ---
    const licensePath = path.join(targetDir, 'LICENSE');
    let chosenLicenseType = preExistingLicense || 'None';

    if (!fs.existsSync(licensePath) && !preExistingLicense) {
        console.log(`\n⚖️  Legal Compliance Auditor: No LICENSE file located.`);
        const licInput = await safeQuestion(`❓ Enter Open Source License (e.g. MIT, Apache-2.0, ISC, BSD-3-Clause, skip): `);
        const cleanedInput = licInput.trim();
        if (cleanedInput.toLowerCase() !== 'skip' && cleanedInput.toLowerCase() !== 'none' && cleanedInput !== '') {
            console.log(`   📡 Querying GitHub Legal Databases for "${cleanedInput.toUpperCase()}"...`);
            const rawTemplate = await fetchRemoteLicense(cleanedInput);
            if (rawTemplate) {
                const parsedText = rawTemplate
                    .replace(/\[year\]|<year>/gi, new Date().getFullYear().toString())
                    .replace(/\[fullname\]|\[name of copyright owner\]|<copyright holders>|<name of author>/gi, gitInfo.name);
                fs.writeFileSync(licensePath, parsedText);
                chosenLicenseType = cleanedInput.toUpperCase();
                console.log(`   ⚖️  Provisioned: LICENSE`);
            } else {
                console.log(`   ⚠️  License "${cleanedInput}" not found. Saving custom label.`);
                chosenLicenseType = cleanedInput;
            }
            packageJson.license = chosenLicenseType;
        }
    } else {
        if (preExistingLicense) {
            chosenLicenseType = preExistingLicense;
            if (!fs.existsSync(licensePath) && ['mit', 'apache-2.0', 'gpl-3.0'].includes(preExistingLicense.toLowerCase())) {
                const rawTemplate = await fetchRemoteLicense(preExistingLicense);
                if (rawTemplate) {
                    const parsedText = rawTemplate
                        .replace(/\[year\]|<year>/gi, new Date().getFullYear().toString())
                        .replace(/\[fullname\]|\[name of copyright owner\]|<copyright holders>|<name of author>/gi, gitInfo.name);
                    fs.writeFileSync(licensePath, parsedText);
                }
            }
        } else if (fs.existsSync(licensePath)) {
            try {
                const currentLicenseContent = fs.readFileSync(licensePath, 'utf8');
                if (currentLicenseContent.includes('MIT')) chosenLicenseType = 'MIT';
                else if (currentLicenseContent.includes('Apache')) chosenLicenseType = 'Apache-2.0';
                else chosenLicenseType = 'Custom';
            } catch (e) {}
        }
        packageJson.license = chosenLicenseType;
    }

    // --- Test scaffolding ---
    if (!stats.hasTests) {
        const bootstrapTest = await safeQuestion(`\n❓ No test files detected. Scaffold a zero-bloat testing harness via Node native test runner? (y/N): `);
        if (bootstrapTest.trim().toLowerCase() === 'y' || bootstrapTest.trim().toLowerCase() === 'yes') {
            const isEsm = packageJson.type === 'module';
            const testExt = isTypeScript ? '.test.ts' : '.test.js';
            const testFilePath = path.join(targetDir, `index${testExt}`);
            const testTemplate = isEsm
                ? `import { test, describe } from 'node:test';\nimport assert from 'node:assert';\n\ndescribe('Core Architecture Testing Suite', () => {\n  test('should verify systemic environmental execution health', () => {\n    assert.strictEqual(1, 1);\n  });\n});\n`
                : `const { test, describe } = require('node:test');\nconst assert = require('node:assert');\n\ndescribe('Core Architecture Testing Suite', () => {\n  test('should verify systemic environmental execution health', () => {\n    assert.strictEqual(1, 1);\n  });\n});\n`;
            fs.writeFileSync(testFilePath, testTemplate);
            packageJson.scripts.test = 'node --test';
            stats.hasTests = true;
            console.log(`   🧪 Generated: index${testExt}`);
        }
    }

    console.log(`\n⚙️  Writing ecosystem configuration artifacts...`);

    // --- ESLint config ---
    if (stats.bootstrapEslintSuite) {
        packageJson.scripts.lint = 'eslint .';
        let eslintConfigContent = '';
        if (isTypeScript) {
            eslintConfigContent = `import eslint from '@eslint/js';\nimport tseslint from 'typescript-eslint';\n\nexport default tseslint.config(\n  eslint.configs.recommended,\n  ...tseslint.configs.recommended,\n);\n`;
        } else {
            if (packageJson.type === 'module') {
                eslintConfigContent = `import js from "@eslint/js";\n\nexport default [\n  js.configs.recommended,\n  {\n    rules: {\n      "no-unused-vars": "warn",\n      "no-undef": "error"\n    }\n  }\n];\n`;
            } else {
                eslintConfigContent = `const js = require("@eslint/js");\n\nmodule.exports = [\n  js.configs.recommended,\n  {\n    rules: {\n      "no-unused-vars": "warn",\n      "no-undef": "error"\n    }\n  }\n];\n`;
            }
        }
        fs.writeFileSync(eslintConfigFile, eslintConfigContent);
        console.log(`   🎨 Provisioned: eslint.config.js`);
    }

    // --- Write / merge package.json ---
    if (fs.existsSync(pkgPath)) {
        try {
            const currentPackageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            currentPackageJson.dependencies = { ...packageJson.dependencies, ...currentPackageJson.dependencies };
            currentPackageJson.devDependencies = { ...packageJson.devDependencies, ...currentPackageJson.devDependencies };
            if (packageJson.scripts.lint && !currentPackageJson.scripts?.lint) {
                currentPackageJson.scripts = currentPackageJson.scripts || {};
                currentPackageJson.scripts.lint = packageJson.scripts.lint;
            }
            fs.writeFileSync(pkgPath, JSON.stringify(currentPackageJson, null, 2));
            console.log(`   🔄 Safely merged discovered dependencies into existing package.json`);
        } catch (e) {}
    } else {
        fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));
        console.log(`   📝 Generated: package.json`);
    }

    // --- Prettier config ---
    const prettierPath = path.join(targetDir, '.prettierrc');
    if (!fs.existsSync(prettierPath)) {
        const useTabs = stats.style.tabCount > (stats.style.space2Count + stats.style.space4Count);
        const useSemi = stats.style.semiCount >= stats.style.noSemiCount;
        const tabWidth = stats.style.space4Count > stats.style.space2Count ? 4 : 2;
        fs.writeFileSync(prettierPath, JSON.stringify({ semi: useSemi, useTabs, tabWidth, singleQuote: true, trailingComma: "es5" }, null, 2));
        console.log(`   🎨 Code formatting mirror locked: .prettierrc`);
    }

    // --- .env.example ---
    if (stats.envVars.size > 0) {
        const envExamplePath = path.join(targetDir, '.env.example');
        if (!fs.existsSync(envExamplePath)) {
            fs.writeFileSync(envExamplePath, Array.from(stats.envVars).map(v => `${v}=`).join('\n') + '\n');
            console.log(`   🔒 Extracted environmental configurations: .env.example`);
        }
    }

    // --- .gitignore ---
    const gitignorePath = path.join(targetDir, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
        fs.writeFileSync(gitignorePath, `node_modules/\ndist/\nbuild/\n.env\n.env.local\n.DS_Store\n*.log\n`);
        console.log(`   ⚙️  Generated: .gitignore`);
    }

    // --- tsconfig.json ---
    if (isTypeScript) {
        const tsconfigPath = path.join(targetDir, 'tsconfig.json');
        if (!fs.existsSync(tsconfigPath)) {
            fs.writeFileSync(tsconfigPath, JSON.stringify({
                compilerOptions: { target: "ES2022", module: "NodeNext", moduleResolution: "NodeNext", esModuleInterop: true, strict: true, skipLibCheck: true, outDir: "./dist" },
                include: ["src/**/*", "**/*.ts"]
            }, null, 2));
            console.log(`   ⚙️  Generated: tsconfig.json`);
        }
    }

    // --- README ---
    const readmePath = path.join(targetDir, 'README.md');
    if (!fs.existsSync(readmePath)) {
        const pName = packageJson.name;
        const layoutTree = buildAsciiTree(targetDir).join('\n');
        const displayDeps = Object.keys(packageJson.dependencies).map(d => `* \`${d}\``).join('\n') || '* None extracted';
        const displayDevDeps = Object.keys(packageJson.devDependencies).map(d => `* \`${d}\``).join('\n') || '* None extracted';
        const licenseBadgeParam = encodeURIComponent(chosenLicenseType.replace(/-/g, '_'));

        const documentationTemplate =
`# ${pName}

![Workspace Engine](https://img.shields.io/badge/engine-node-${packageJson.type === 'module' ? 'green' : 'blue'}?style=flat)
![License Architecture](https://img.shields.io/badge/license-${licenseBadgeParam}-orange?style=flat)
![Development Tooling](https://img.shields.io/badge/compiled_via-${isTypeScript ? 'typescript' : 'javascript'}-blueviolet?style=flat)

${packageJson.description}

## Workspace Dependency Landscapes

### Core Infrastructure Runtimes (\`dependencies\`)
${displayDeps}

### System Tooling Engines (\`devDependencies\`)
${displayDevDeps}

---

## Project Architecture Layout
\`\`\`text
${layoutTree}
\`\`\`

## Installation

\`\`\`bash
${activePkgManager} install
\`\`\`
`;
        fs.writeFileSync(readmePath, documentationTemplate);
        console.log(`   📖 Generated: README.md`);
    }

    // --- Phantom injection fix ---
    if (stats.phantomInjections.size > 0 || (stats.injectDotenvEngine && stats.filesWithEnvVars.size > 0)) {
        console.log(`\n💡 Source Code Modification Subsystem:`);
        const injectChoice = await safeQuestion(`❓ Found phantom modules or unmanaged env components. Mutate file headers cleanly now? (y/N): `);

        if (injectChoice.trim().toLowerCase() === 'y' || injectChoice.trim().toLowerCase() === 'yes') {
            const allTargets = new Set([...stats.phantomInjections.keys(), ...stats.filesWithEnvVars]);

            for (const filePath of allTargets) {
                const originalCode = readFileSyncNormalized(filePath);
                let declarationBlock = '';

                const missingModules = stats.phantomInjections.get(filePath);
                if (missingModules) {
                    for (const mod of missingModules) {
                        if (packageJson.type === 'module') declarationBlock += `import ${mod} from '${mod}';\n`;
                        else declarationBlock += `const ${mod} = require('${mod}');\n`;
                    }
                }

                if (stats.injectDotenvEngine && stats.filesWithEnvVars.has(filePath) && !originalCode.includes('dotenv')) {
                    if (packageJson.type === 'module') declarationBlock += `import 'dotenv/config';\n`;
                    else declarationBlock += `require('dotenv').config();\n`;
                }

                if (declarationBlock !== '') {
                    fs.writeFileSync(filePath, smartPrepend(originalCode, declarationBlock));
                    console.log(`   ⚡ Injected headers: ${path.relative(targetDir, filePath)}`);
                }
            }
        }
    }

    // --- Deprecation scan via npm-deprecated-check ---
    console.log(`\n🛑 INITIALIZING LIVE ECOSYSTEM DEPRECATION SECURITY SCAN...`);
    console.log(`   Running integrated npm-deprecated-check validation:\n`);
    try {
        const localRequire = createRequire(import.meta.url);
        const dependencyPkgJsonPath = localRequire.resolve('npm-deprecated-check/package.json');
        const dependencyPkgJson = JSON.parse(fs.readFileSync(dependencyPkgJsonPath, 'utf8'));
        const binRelativeMapping = typeof dependencyPkgJson.bin === 'string'
            ? dependencyPkgJson.bin
            : (dependencyPkgJson.bin['npm-deprecated-check'] || dependencyPkgJson.bin['ndc']);
        const absoluteExecutablePath = path.join(path.dirname(dependencyPkgJsonPath), binRelativeMapping);
        execSync(`node "${absoluteExecutablePath}" current`, { stdio: 'inherit', cwd: targetDir });
    } catch (err) {}

    // --- Conflicting lockfiles ---
    if (stats.conflictingLockfiles.length > 1) {
        console.log(`\n⚠️  CONFLICTING LOCKFILES DETECTED: [${stats.conflictingLockfiles.join(', ')}]`);
        const cleanLocks = await safeQuestion(`❓ Purge legacy/mismatched lockfiles to protect package integrity? (y/N): `);
        if (cleanLocks.trim().toLowerCase() === 'y' || cleanLocks.trim().toLowerCase() === 'yes') {
            const packageEngineLockmap = { npm: 'package-lock.json', pnpm: 'pnpm-lock.yaml', yarn: 'yarn.lock', bun: 'bun.lockb' };
            const operationalLockfile = packageEngineLockmap[activePkgManager];
            for (const lockfile of stats.conflictingLockfiles) {
                if (lockfile !== operationalLockfile) {
                    try {
                        fs.unlinkSync(path.join(targetDir, lockfile));
                        console.log(`   🗑️  Cleaned: ${lockfile}`);
                    } catch (e) {}
                }
            }
        }
    }

    // --- Final install prompt ---
    console.log(`\n📦 Auto-scaffolding pipeline complete!`);

    // Summary report
    console.log(`\n${'═'.repeat(67)}`);
    console.log(`📊 DEPENDENCY INTELLIGENCE SUMMARY`);
    console.log(`${'═'.repeat(67)}`);
    console.log(`   📁 Files scanned:           ${stats.scannedFiles}`);
    console.log(`   📦 Packages imported:        ${stats.allImportedPackages.size}`);
    if (stats.ghostDependencies.size > 0)
        console.log(`   🚨 Ghost deps (missing):     ${stats.ghostDependencies.size} — \x1b[31mCRITICAL\x1b[0m`);
    if (stats.orphanedDependencies.size > 0)
        console.log(`   🗑️  Orphaned deps (unused):   ${stats.orphanedDependencies.size}`);
    if (allDiscoveredUnused.size > 0)
        console.log(`   ⚡ Unused imports:           ${allDiscoveredUnused.size}`);
    if (stats.deprecatedPackages.size > 0)
        console.log(`   📛 Deprecated packages:      ${stats.deprecatedPackages.size}`);
    if (stats.phantomInjections.size > 0)
        console.log(`   👻 Phantom injections:       ${stats.phantomInjections.size} file(s)`);
    if (stats.discoveredSecrets.length > 0)
        console.log(`   🔐 Hardcoded secrets:        ${stats.discoveredSecrets.length} — \x1b[31mSECURITY RISK\x1b[0m`);
    console.log(`${'═'.repeat(67)}`);

    const userPromptChoice = await safeQuestion(`❓ Detected package manager: "${activePkgManager}". Run "${activePkgManager} install" now? (y/N): `);
    rl.close();

    const normalizedAnswer = userPromptChoice.trim().toLowerCase();
    if (normalizedAnswer === 'y' || normalizedAnswer === 'yes') {
        console.log(`\n⏳ Executing automated asset installations...`);
        try {
            execSync(`${activePkgManager} install`, { stdio: 'inherit', cwd: targetDir });
            console.log(`\n🎉 Project fully mapped, configured, and installed successfully!`);
        } catch (err) {
            console.error(`\n❌ Installation returned an issue. Please run "${activePkgManager} install" manually.`);
        }
    } else {
        console.log(`\n▶️  Skipping install. Run "${activePkgManager} install" manually when ready.`);
    }
}

main();
