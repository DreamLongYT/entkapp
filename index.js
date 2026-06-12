#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { builtinModules, createRequire } from 'module';
import { execSync } from 'child_process';
import readline from 'readline/promises';

const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.turbo', 'coverage', 'out']);
const VALID_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);

// --- High Performance Structural Analysis Engine ---
const REGEX_PATTERNS = {
    imports: /import\s+(?:[\w\s{},*]*\s+from\s+)?['"]([^'"]+)['"]/g,
    cjs: /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    dynamic: /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    exports: /export\s+(?:[\w\s{},*]*\s+from\s+)?['"]([^'"]+)['"]/g,
    env: /(?:process\.env|import\.meta\.env)\.([A-Z_][A-Z0-9_]*)/g,
    testFile: /\.(test|spec)\.(js|ts|jsx|tsx)$/i,
    
    // Quality & Code Smell Checks
    legacyVar: /\bvar\s+[a-zA-Z_]/g,
    dangerousEval: /\beval\s*\(/g,
    syncFsCalls: /\.readFileSync|\.writeFileSync|\.mkdirSync|\.existsSync/g,
    objAccessor: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\./g
};

const COMMON_EXTERNAL_TOKENS = new Set(['axios', 'lodash', 'dotenv', 'cors', 'zod', 'mongoose', 'jsonwebtoken', 'chalk', 'helmet', 'prisma', 'redis', 'pg']);

function getGitIdentity() {
    const identity = { name: "Developer", author: "", repository: "" };
    try {
        const name = execSync('git config user.name', { encoding: 'utf8', stdio: 'pipe' }).trim();
        const email = execSync('git config user.email', { encoding: 'utf8', stdio: 'pipe' }).trim();
        if (name) {
            identity.name = name;
            identity.author = `${name}${email ? ` <${email}>` : ''}`;
        }
        
        const url = execSync('git config --get remote.origin.url', { encoding: 'utf8', stdio: 'pipe' }).trim();
        if (url) identity.repository = url.replace(/\.git$/, '');
    } catch (e) {}
    return identity;
}

function detectPackageManager(targetDir) {
    if (fs.existsSync(path.join(targetDir, 'pnpm-lock.yaml'))) return 'pnpm';
    if (fs.existsSync(path.join(targetDir, 'yarn.lock'))) return 'yarn';
    if (fs.existsSync(path.join(targetDir, 'package-lock.json'))) return 'npm';

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

function cleanPackageName(importString) {
    if (!importString || /^[./~\\]/.test(importString)) return null;
    if (importString.startsWith('@')) return importString.split('/').slice(0, 2).join('/');
    return importString.split('/')[0];
}

async function inspectNpmPackage(pkgName) {
    try {
        const response = await fetch(`https://registry.npmjs.org/${pkgName}/latest`, {
            headers: { 'User-Agent': 'pkg-scaffold-dx-client/2.7' },
            signal: AbortSignal.timeout(4000)
        });
        if (response.status === 200) {
            const data = await response.json();
            return { version: data.version, error: null };
        }
        if (response.status === 404) return { version: null, error: 'NOT_FOUND' };
    } catch (e) {
        return { version: 'latest', error: 'NETWORK_FAIL' };
    }
    return null;
}

async function fetchRemoteLicense(licenseKey) {
    try {
        const response = await fetch(`https://api.github.com/licenses/${licenseKey.toLowerCase()}`, {
            headers: { 'User-Agent': 'pkg-scaffold-dx-client/2.7' },
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
    if (buffer[0] === 0xFE && buffer[1] === 0xFF) return buffer.toString('utf16be');
    return buffer.toString('utf8');
}

function scanWorkspace(dir, stats) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!IGNORED_DIRS.has(file) && !file.startsWith('.')) scanWorkspace(fullPath, stats);
        } else {
            const ext = path.extname(file);
            
            if (file === 'index.html' || file.startsWith('vite.config.')) stats.hasHtml = true;
            if (REGEX_PATTERNS.testFile.test(file)) stats.hasTests = true;
            if (ext === '.ts' || ext === '.tsx') stats.tsFiles++;
            if (ext === '.js' || ext === '.jsx' || ext === '.mjs') stats.jsFiles++;

            if (VALID_EXTENSIONS.has(ext)) {
                const content = readFileSyncNormalized(fullPath);
                if (content.includes('import ') || content.includes('export ')) stats.usesEsm = true;
                
                analyzeCodeStyle(content, stats);

                const explicitlyImported = new Set();
                let match;
                
                for (const key of ['imports', 'cjs', 'dynamic', 'exports']) {
                    REGEX_PATTERNS[key].lastIndex = 0;
                    while ((match = REGEX_PATTERNS[key].exec(content)) !== null) {
                        const cleaned = cleanPackageName(match[1]);
                        if (cleaned && !builtinModules.includes(cleaned)) stats.rawDeps.add(cleaned);
                        if (cleaned) explicitlyImported.add(cleaned);
                    }
                }

                const usedTokens = new Set();
                REGEX_PATTERNS.objAccessor.lastIndex = 0;
                while ((match = REGEX_PATTERNS.objAccessor.exec(content)) !== null) {
                    usedTokens.add(match[1]);
                }

                for (const token of usedTokens) {
                    if (!explicitlyImported.has(token)) {
                        const isCoreBuiltin = builtinModules.includes(token);
                        const isKnownExternal = COMMON_EXTERNAL_TOKENS.has(token);

                        if (isCoreBuiltin || isKnownExternal) {
                            if (isKnownExternal) stats.rawDeps.add(token);
                            if (!stats.phantomInjections.has(fullPath)) stats.phantomInjections.set(fullPath, new Set());
                            stats.phantomInjections.get(fullPath).add(token);
                        }
                    }
                }

                REGEX_PATTERNS.env.lastIndex = 0;
                while ((match = REGEX_PATTERNS.env.exec(content)) !== null) stats.envVars.add(match[1]);
            }
        }
    }
}

function buildAsciiTree(dir, prefix = '') {
    let treeLines = [];
    try {
        const files = fs.readdirSync(dir).filter(f => !IGNORED_DIRS.has(f) && !f.startsWith('.'));
        files.forEach((file, idx) => {
            const isLast = idx === files.length - 1;
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            
            treeLines.push(`${prefix}${isLast ? '└── ' : '├── '}${file}`);
            if (stat.isDirectory()) {
                treeLines = treeLines.concat(buildAsciiTree(fullPath, prefix + (isLast ? '    ' : '│   ')));
            }
        });
    } catch (e) {}
    return treeLines;
}

async function main() {
    const targetDir = process.cwd();
    const folderName = path.basename(targetDir);
    const gitInfo = getGitIdentity();
    const activePkgManager = detectPackageManager(targetDir);
    const pkgPath = path.join(targetDir, 'package.json');
    let preExistingLicense = null;

    console.log(`\n===================================================================`);
    console.log(`🚀 pkg-scaffold v2.7: Deep Intelligence Workspace Diagnostic Run`);
    console.log(`===================================================================\n`);

    // --- Package.json Pre-existing Interceptor Subsystem ---
    if (fs.existsSync(pkgPath)) {
        console.log(`⚠️  An existing package.json was found in this working directory.`);
        console.log(`📡 Analyzing existing installation arrays for invalid metrics...`);
        try {
            const existingData = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            
            // Capture license choice from the pre-existing package definition profile
            if (existingData.license && typeof existingData.license === 'string' && existingData.license.toLowerCase() !== 'none') {
                preExistingLicense = existingData.license;
            }

            const combinedDeps = Object.keys({ ...existingData.dependencies, ...existingData.devDependencies });
            let brokenEcosystem = combinedDeps.length === 0;
            
            for (const dep of combinedDeps) {
                const check = await inspectNpmPackage(dep);
                if (check && check.error === 'NOT_FOUND') {
                    brokenEcosystem = true;
                    console.log(`   ❌ Identified non-existent package on registry tracks: "${dep}"`);
                }
            }

            if (brokenEcosystem) {
                console.log(`\n🛑 CRITICAL COMPLIANCE BREAK: Your current package.json is empty or contains non-existent packages.`);
                console.log(`👉 Action Required: Please remove or backup the existing 'package.json' from this folder.`);
                console.log(`   Once removed, re-run 'pkg-scaffold' to synthesize a verified configuration profile.\n`);
                return;
            } else {
                console.log(`   ℹ️  Existing package.json appears structurally sound. Skipping generation arrays to prevent asset loss.`);
            }
        } catch (err) {
            console.log(`\n🛑 CRITICAL: Existing package.json is malformed or corrupt.`);
            console.log(`👉 Action Required: Please remove it from the workspace so pkg-scaffold can compile a clean matrix.\n`);
            return;
        }
    }

    const stats = {
        tsFiles: 0, jsFiles: 0, usesEsm: false, hasHtml: false, hasTests: false,
        rawDeps: new Set(), envVars: new Set(),
        style: { semiCount: 0, noSemiCount: 0, tabCount: 0, space2Count: 0, space4Count: 0 },
        quality: { varCount: 0, hasEval: false, syncFsCount: 0 },
        phantomInjections: new Map()
    };

    scanWorkspace(targetDir, stats);

    const isTypeScript = stats.tsFiles > stats.jsFiles;
    const isFrontendWeb = stats.hasHtml || stats.rawDeps.has('react') || stats.rawDeps.has('vue') || stats.rawDeps.has('vite');

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

    if (stats.rawDeps.size > 0) {
        console.log(`📡 Resolving baseline package registry definitions...`);
        for (const pkg of stats.rawDeps) {
            const cleaned = cleanPackageName(pkg);
            if (cleaned && !builtinModules.includes(cleaned)) {
                const check = await inspectNpmPackage(cleaned);
                if (check && check.error !== 'NOT_FOUND') {
                    const version = check.version || 'latest';
                    const devRegistry = ['vite', 'vitest', 'typescript', 'eslint', 'prettier', 'jest'];
                    if (devRegistry.includes(cleaned)) {
                        packageJson.devDependencies[cleaned] = `^${version}`;
                    } else {
                        packageJson.dependencies[cleaned] = `^${version}`;
                    }
                    console.log(`   ✅ Synced verified package parameters: ${cleaned}@^${version}`);
                }
            }
        }
    }

    if (stats.phantomInjections.size > 0) {
        console.log(`\n👻 PHANTOM STRUCTURE ALERT: UNIMPORTED EXECUTIONS DETECTED`);
        console.log(`───────────────────────────────────────────────────────────────────`);
        for (const [filePath, missingModules] of stats.phantomInjections.entries()) {
            console.log(`📂 File: ${path.relative(targetDir, filePath)}`);
            console.log(`   ❌ Used but never imported: ${Array.from(missingModules).map(m => `"${m}"`).join(', ')}`);
        }
        console.log(`───────────────────────────────────────────────────────────────────`);
    }

    if (stats.quality.varCount > 0 || stats.quality.hasEval || stats.quality.syncFsCount > 0) {
        console.log(`\n⚠️  CODE ARCHITECTURE & MODERNIZATION COMPLIANCE WARNINGS:`);
        console.log(`───────────────────────────────────────────────────────────────────`);
        if (stats.quality.varCount > 0) console.log(`   ⚡ Found ${stats.quality.varCount} instances of legacy 'var' statements. Transition to blocks ('let' / 'const').`);
        if (stats.quality.hasEval) console.log(`   🔥 DANGER: 'eval()' invocation structures detected! Refactor to mitigate critical remote code execution vectors.`);
        if (stats.quality.syncFsCount > 0) console.log(`   📉 Performance Alert: Found ${stats.quality.syncFsCount} block-level Sync filesystem configurations inside threads. Transition to promises ('fs/promises').`);
        console.log(`───────────────────────────────────────────────────────────────────`);
    }

    // ─── INTERACTIVE ON-DEMAND REMOTE LICENSE PROVISIONER ───────────────────
    const licensePath = path.join(targetDir, 'LICENSE');
    let chosenLicenseType = preExistingLicense || 'None';
    
    if (!fs.existsSync(licensePath) && !preExistingLicense) {
        console.log(`\n⚖️  Legal Compliance Auditor: No LICENSE file or package.json license descriptor located.`);
        const rlLicense = readline.createInterface({ input: process.stdin, output: process.stdout });
        const licInput = await rlLicense.question(`❓ Select an Open Source License to pull from registry (mit / apache-2.0 / gpl-3.0 / skip): `);
        rlLicense.close();

        const cleanedInput = licInput.trim().toLowerCase();
        if (['mit', 'apache-2.0', 'gpl-3.0'].includes(cleanedInput)) {
            console.log(`   📡 Querying GitHub Legal Databases for "${cleanedInput.toUpperCase()}" template...`);
            const rawTemplate = await fetchRemoteLicense(cleanedInput);
            
            if (rawTemplate) {
                const parsedText = rawTemplate
                    .replace(/\[year\]|<year>/gi, '2026')
                    .replace(/\[fullname\]|\[name of copyright owner\]|<copyright holders>|<name of author>/gi, gitInfo.name);

                fs.writeFileSync(licensePath, parsedText);
                chosenLicenseType = cleanedInput.toUpperCase();
                packageJson.license = cleanedInput.toUpperCase();
                console.log(`   ⚖️  Successfully provisioned, stamped, and generated legal asset: LICENSE`);
            } else {
                console.log(`   ❌ Connection boundary dropped. Skipping live license file provisioning.`);
            }
        }
    } else {
        // Skip prompt routing because metadata parameter indicators exist
        if (preExistingLicense) {
            console.log(`\n⚖️  Legal Compliance Auditor: License "${preExistingLicense}" detected in package.json. Skipping interactive step.`);
            chosenLicenseType = preExistingLicense;
            
            // Auto-provisioning loop if the descriptor is preset but the physical asset is absent
            if (!fs.existsSync(licensePath) && ['mit', 'apache-2.0', 'gpl-3.0'].includes(preExistingLicense.toLowerCase())) {
                console.log(`   📡 Auto-provisioning missing physical LICENSE layer text files for "${preExistingLicense.toUpperCase()}"...`);
                const rawTemplate = await fetchRemoteLicense(preExistingLicense);
                if (rawTemplate) {
                    const parsedText = rawTemplate
                        .replace(/\[year\]|<year>/gi, '2026')
                        .replace(/\[fullname\]|\[name of copyright owner\]|<copyright holders>|<name of author>/gi, gitInfo.name);
                    fs.writeFileSync(licensePath, parsedText);
                    console.log(`   ⚖️  Successfully mirrored and synthesized missing license file artifacts.`);
                }
            }
        } else if (fs.existsSync(licensePath)) {
            console.log(`\n⚖️  Legal Compliance Auditor: Existing physical LICENSE file detected. Skipping interactive step.`);
            try {
                const currentLicenseContent = fs.readFileSync(licensePath, 'utf8');
                if (currentLicenseContent.includes('MIT')) chosenLicenseType = 'MIT';
                else if (currentLicenseContent.includes('Apache')) chosenLicenseType = 'Apache-2.0';
                else chosenLicenseType = 'Custom';
            } catch(e) {}
        }
        packageJson.license = chosenLicenseType;
    }

    console.log(`\n⚙️  Writing ecosystem configuration artifacts...`);

    if (!fs.existsSync(pkgPath)) { 
        fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2)); 
        console.log(`   📝 Injected: package.json`); 
    }

    const prettierPath = path.join(targetDir, '.prettierrc');
    if (!fs.existsSync(prettierPath)) {
        const useTabs = stats.style.tabCount > (stats.style.space2Count + stats.style.space4Count);
        const useSemi = stats.style.semiCount >= stats.style.noSemiCount;
        const tabWidth = stats.style.space4Count > stats.style.space2Count ? 4 : 2;
        fs.writeFileSync(prettierPath, JSON.stringify({ semi: useSemi, useTabs: useTabs, tabWidth: tabWidth, singleQuote: true, trailingComma: "es5" }, null, 2));
        console.log(`   🎨 Code formatting mirror locked: .prettierrc`);
    }

    if (stats.envVars.size > 0) {
        const envExamplePath = path.join(targetDir, '.env.example');
        if (!fs.existsSync(envExamplePath)) {
            fs.writeFileSync(envExamplePath, Array.from(stats.envVars).map(v => `${v}=`).join('\n') + '\n');
            console.log(`   🔒 Extracted environmental configurations: .env.example`);
        }
    }

    const gitignorePath = path.join(targetDir, '.gitignore');
    if (!fs.existsSync(gitignorePath)) { fs.writeFileSync(gitignorePath, `node_modules/\ndist/\nbuild/\n.env\n.env.local\n.DS_Store\n`); console.log(`   w Structural default configurations locked: .gitignore`); }

    if (isTypeScript) {
        const tsconfigPath = path.join(targetDir, 'tsconfig.json');
        if (!fs.existsSync(tsconfigPath)) {
            fs.writeFileSync(tsconfigPath, JSON.stringify({ compilerOptions: { target: "ES2022", module: "NodeNext", moduleResolution: "NodeNext", esModuleInterop: true, strict: true, skipLibCheck: true, outDir: "./dist" }, include: ["src/**/*", "**/*.ts"] }, null, 2));
            console.log(`   # Structural default configurations locked: tsconfig.json`);
        }
    }

    // --- Adaptive Flat Shields.io README Layout ---
    const readmePath = path.join(targetDir, 'README.md');
    if (!fs.existsSync(readmePath)) {
        const pName = packageJson.name;
        const layoutTree = buildAsciiTree(targetDir).join('\n');
        
        const displayDeps = Object.keys(packageJson.dependencies).map(d => `* \`${d}\``).join('\n') || '* None extracted';
        const displayDevDeps = Object.keys(packageJson.devDependencies).map(d => `* \`${d}\``).join('\n') || '* None extracted';

        const documentationTemplate = 
`# ${pName}

[![NPM Version](https://img.shields.io/npm/v/${pName}.svg?style=flat)](https://www.npmjs.com/package/${pName})
[![License](https://img.shields.io/npm/l/${pName}.svg?style=flat)](https://www.npmjs.com/package/${pName})

${packageJson.description}

## Workspace Dependency Landscapes

### Core Infrastructure Runtimes (\`dependencies\`)
${displayDeps}

### System Tooling Engines (\`devDependencies\`)
${displayDevDeps}

### Underlying Tooling Architecture
This project environment layout maps out core metadata elements dynamically using:
* \`npm-deprecated-check\` (Bundled internal core validation system for dependency deprecation checking routines)

---

## Project Architecture Layout
\`\`\`text
${layoutTree}
\`\`\`

## Installation & Launch Procedures
Initialize the workspace tracking structures via your active system package engine:

\`\`\`bash
${activePkgManager} install
\`\`\`
`;
        fs.writeFileSync(readmePath, documentationTemplate);
        console.log(`   📖 Auto-generated system asset metrics: README.md`);
    }

    // --- Interactive Code Mutation Pipeline ---
    if (stats.phantomInjections.size > 0) {
        console.log(`\n💡 Source Code Modification Subsystem:`);
        const rlPhantom = readline.createInterface({ input: process.stdin, output: process.stdout });
        const injectChoice = await rlPhantom.question(`❓ Found unimported dependencies in code execution chains. Inject statements automatically? (y/N): `);
        rlPhantom.close();

        if (injectChoice.trim().toLowerCase() === 'y' || injectChoice.trim().toLowerCase() === 'yes') {
            for (const [filePath, missingModules] of stats.phantomInjections.entries()) {
                const originalCode = readFileSyncNormalized(filePath);
                let declarationBlock = '';

                for (const mod of missingModules) {
                    if (packageJson.type === 'module') {
                        declarationBlock += `import ${mod} from '${mod}';\n`;
                    } else {
                        declarationBlock += `const ${mod} = require('${mod}');\n`;
                    }
                }
                fs.writeFileSync(filePath, declarationBlock + originalCode);
                console.log(`   ⚡ Injected declarations into top header row: ${path.relative(targetDir, filePath)}`);
            }
        }
    }

    // --- Dynamic Self-Contained Local Auditing via npm-deprecated-check ---
    console.log(`\n🛑 INITIALIZING LIVE ECOSYSTEM DEPRECATION SECURITY SCAN...`);
    console.log(`   Running integrated npm-deprecated-check validation algorithms:\n`);
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

    // --- Automated Asset Installation Pipeline ---
    console.log(`\n📦 Auto-scaffolding pipeline complete!`);
    const rlInstall = readline.createInterface({ input: process.stdin, output: process.stdout });
    const userPromptChoice = await rlInstall.question(`❓ Detected system default manager: "${activePkgManager}". Run "${activePkgManager} install" automatically now? (y/N): `);
    rlInstall.close();

    const normalizedAnswer = userPromptChoice.trim().toLowerCase();
    if (normalizedAnswer === 'y' || normalizedAnswer === 'yes') {
        console.log(`\n⏳ Executing automated asset installations via background child processes...`);
        try {
            console.log(`   Running: "${activePkgManager} install" inside current folder...`);
            execSync(`${activePkgManager} install`, { stdio: 'inherit', cwd: targetDir });
            console.log(`\n🎉 Project fully mapped, configurations customized, and environments installed successfully!`);
        } catch (err) {
            console.error(`\n❌ Automatic package extraction successful, but target installation shell returned an issue.`);
        }
    } else {
        console.log(`\n▶️  Skipping automated setup execution. Workspace configured! Run "${activePkgManager} install" manually whenever you're ready.`);
    }
}

main();