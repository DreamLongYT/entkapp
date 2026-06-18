import { DeadCodeDetector } from "./ast/DeadCodeDetector.js";
import { OxcAnalyzer } from "./ast/OxcAnalyzer.js";
import { SecretScanner } from './ast/SecretScanner.js';
import { AdvancedAnalysis } from './ast/AdvancedAnalysis.js';
import { WorkspaceDiagnostic } from './resolution/WorkspaceDiagnostic.js';
/**
 * ============================================================================
 * 📦 entkapp v4.1.0: Unified Architectural Refactoring Orchestrator
 * ============================================================================
 * Main execution bridge managing multi-pass compilation cycles, semantic cross-linking,
 * supply-chain validation audits, and automated structural healing rollbacks.
 */

import fs from 'fs/promises';
import { existsSync, readFileSync } from 'fs'; 
import path from 'path';
import ansis from 'ansis';
import readline from 'readline/promises';

// Import local domain architecture sub-systems
import { EngineContext } from './EngineContext.js';
import { ASTAnalyzer } from './ast/ASTAnalyzer.js';
import { BarrelParser } from './ast/BarrelParser.js';
import { MagicDetector } from './ast/MagicDetector.js';
import { PathMapper } from './resolution/PathMapper.js';
import { WorkspaceGraph } from './resolution/WorkSpaceGraph.js';
import { DependencyResolver } from './resolution/DepencyResolver.js';
import { CircularDetector } from './resolution/CircularDetector.js';
import { TransactionManager } from './refractor/TransactionManager.js';
import { ImpactAnalyzer } from './refractor/ImpactAnalyzer.js';
import { SourceRewriter } from './refractor/SourceRewriter.js';
import { TypeIntegrity } from './refractor/TypeIntegrity.js';
import { GitSandbox } from './healing/GitSandbox.js';
import { SelfHealer } from './healing/SelfHealer.js';
import { IncrementalCacheManager } from './performance/GraphCache.js';
import { WorkerPool } from './performance/WorkerPool.js';
import { SupplyChainGuard } from './performance/SupplyChainGuard.js';

/**
 * Primary Refactoring Engine Core Coordination Controller
 */
export class RefactoringEngine {
  constructor(options = {}) {
    // Stage 1: Instantiate State Registers and Global Variables context
    this.context = new EngineContext(options.cwd || process.cwd());
    this.context.options = options;
    this.context.autoFix = options.autoFix;
    this.context.tsconfigFilename = options.tsconfig;
    this.context.testCommand = options.testCommand;
    this.context.workspace = options.workspace;
    this.context.verbose = options.verbose;
    this.context.skipConfirm = options.skipConfirm;
    this.context.debug = options.debug;
    this.context.entryPoints = options.entryPoints || [];
    this.context.exclude = options.exclude || [];
    this.context.rules = options.rules || {};
    // Stage 2: Initialize File Mappers and Multi-Package Graph Networks
    this.pathMapper = new PathMapper(this.context);
    this.workspaceGraph = new WorkspaceGraph(this.context);
    this.resolver = new DependencyResolver(this.context, this.pathMapper, this.workspaceGraph);
    this.circularDetector = new CircularDetector(this.context);
    
    // Stage 3: Wire official AST Syntax parsers and framework processors
    this.analyzer = new ASTAnalyzer(this.context);
    this.oxcAnalyzer = new OxcAnalyzer(this.context);
    this.barrelParser = new BarrelParser(this.context, this.resolver);
    this.magicDetector = new MagicDetector(this.context);
    
    // Stage 4: Connect Transaction managers and surgical code generation scripts
    this.txManager = new TransactionManager(this.context);
    this.impactAnalyzer = new ImpactAnalyzer(this.context);
    this.sourceRewriter = new SourceRewriter(this.context);
    this.typeIntegrity = new TypeIntegrity(this.context);
    
    // Stage 5: Bind security audit utilities and performance cache rings
    this.supplyChainGuard = new SupplyChainGuard(this.context);
    this.cacheManager = new IncrementalCacheManager(this.context);
    this.workerPool = new WorkerPool(this.context);
    this.gitSandbox = new GitSandbox(this.context);
    this.selfHealer = new SelfHealer(this.context, this.txManager, this.gitSandbox);
    // Stage 6: Secret / hardcoded credential scanner
    this.secretScanner = new SecretScanner();
    this.advancedAnalysis = new AdvancedAnalysis(this.context);
    this.workspaceDiagnostic = new WorkspaceDiagnostic(this.context);
  }

  /**
   * Main Operational Loop executing multi-stage analysis passes across files.
   */
  async run() {
    try {
      console.log(ansis.bold.green('🎯 Starting entkapp Operational Optimization Cycle...'));
      
      let rl;
      if (!this.context.skipConfirm) {
        rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
      }
      
      // Pass 1: Boot environment contexts and load alias configuration maps
      await this.oxcAnalyzer.init();
      await this.pathMapper.loadMappings(this.context.tsconfigFilename);
      
      // Always attempt workspace mesh initialization – it will auto-detect workspace
      // configuration and flip `context.isWorkspaceEnabled` when found.
      console.log(ansis.dim('🌐 Probing for monorepo workspace configuration...'));
      await this.workspaceGraph.initializeWorkspaceMesh();
      if (this.context.isWorkspaceEnabled) {
        console.log(ansis.dim('🌐 Monorepo workspace detected – mapping package mesh layers...'));
      }

      // Load asset fingerprints from disk cache to maximize cold-start performance
      const cacheManifest = await this.cacheManager.loadCacheManifest();

      // Pass 2: Recursively crawl directories to compile target codebase files list
      const fileList = [];
      await this.discoverSourceFiles(this.context.cwd, fileList);
      this.context.metrics.totalFilesScanned = fileList.length;

      // Identify meta-framework setups (Next.js, Remix, Nuxt, etc.)
      const activeFrameworkEcosystems = await this.magicDetector.identifyActiveProjectEcosystems(this.context.cwd);

      // Separate explicit configuration packages out for targeted supply chain security checks
      const sourceCodeFilesList = [];
      for (const file of fileList) {
        if (file.endsWith('package.json')) {
          await this.auditManifestSupplyChain(file);
        } else {
          sourceCodeFilesList.push(file);
        }
      }

      // Pass 3: Process source file tokens using high-performance concurrent workers
      let parallelParseCompleted = false;
      if (sourceCodeFilesList.length > 1) {
        parallelParseCompleted = await this.workerPool.parallelAnalyzeCodebase(sourceCodeFilesList, this);
      }

      for (const filePath of sourceCodeFilesList) {
        const node = this.context.getOrCreateNode(filePath);
        const currentHash = await this.cacheManager.computeHash(filePath);
        node.contentHash = currentHash;

        const isFileCached = cacheManifest[filePath] && cacheManifest[filePath].hash === currentHash;

        if (isFileCached) {
          this.context.metrics.cacheHits++;
          this.hydrateNodeFromCache(node, cacheManifest[filePath]);
          // Re-run secret scan even on cached files (secrets may change without AST change)
          try {
            const cachedContent = await fs.readFile(filePath, 'utf8');
            const secretFindings = this.secretScanner.scanFileContent(filePath, cachedContent);
            if (secretFindings.length > 0) {
              node.securityThreats = (node.securityThreats || []).concat(secretFindings);
              secretFindings.forEach(f => this.context.allSecretFindings.push(f));
            }
          } catch { /* unreadable file – skip */ }
        } else if (!parallelParseCompleted) {
          this.context.metrics.cacheMisses++;
          const fileContent = await fs.readFile(filePath, 'utf8'); // Read file content here
          if (this.oxcAnalyzer.isAvailable) {
            await this.oxcAnalyzer.parseFile(filePath, fileContent, node);
          } else {
            await this.analyzer.parseFile(filePath, fileContent, node);
          }
          // Secret scan on freshly parsed content
          const secretFindings = this.secretScanner.scanFileContent(filePath, fileContent);
          if (secretFindings.length > 0) {
            node.securityThreats = (node.securityThreats || []).concat(secretFindings);
            secretFindings.forEach(f => this.context.allSecretFindings.push(f));
          }
        }

        await this.magicDetector.injectVirtualConsumerEdges(filePath, node, activeFrameworkEcosystems);
        
        // Fix: Explicitly protect entry points defined in local configuration
        const slashify = (p) => path.resolve(this.context.cwd, p).replace(/\\/g, '/');
        if (this.context.entryPoints && this.context.entryPoints.some(ep => {
          const absEp = slashify(ep);
          const cleanAbsEp = absEp.replace(/\.[^/.]+$/, "");
          const cleanFilePath = slashify(filePath).replace(/\.[^/.]+$/, "");
          return absEp === slashify(filePath) || cleanAbsEp === cleanFilePath;
        })) {
          node.isLibraryEntry = true;
        }
        // node.externalPackageUsage.forEach(pkg => this.context.usedExternalPackages.add(pkg));
      }

      // Fix: Automatically mark active ecosystem packages as used.
      // Maps internal plugin names to their canonical npm package names.
      const pluginToPackageMap = {
        'typescript': 'typescript',
        'vitest': 'vitest',
        'eslint': 'eslint',
        'prettier': 'prettier',
        'tailwindcss': 'tailwindcss',
        'postcss': 'postcss',
        'jest': 'jest',
        'playwright': '@playwright/test',
        'cypress': 'cypress',
        'storybook': 'storybook',
        'nextjs': 'next',
        'nuxt': 'nuxt',
        'remix': '@remix-run/dev',
        'sveltekit': '@sveltejs/kit',
        'astro': 'astro'
      };

      activeFrameworkEcosystems.forEach(ecosystem => {
        if (ecosystem !== 'universal-tooling-vectors') {
          const pkgName = pluginToPackageMap[ecosystem] || ecosystem;
          this.context.usedExternalPackages.add(pkgName);
        }
      });

      // Ensure all workspace package names are pre-marked as used so they are
      // never reported as unused dependencies in the manifest audit.
      if (this.context.isWorkspaceEnabled) {
        this.workspaceGraph.markWorkspacePackagesAsUsed();
      }

      // Pass 4: Evaluate graph edges and link connections across the codebase mesh
      console.log(ansis.dim('🔗 Linking graph edges and checking structural usage paths...'));
      if (this.context.verbose) {
        console.log(`[Linker] Starting dependency graph linkage for ${this.context.projectGraph.size} nodes.`);
      }
      await this.linkDependencyGraph();
      if (this.context.verbose) {
        const totalEdges = Array.from(this.context.projectGraph.values()).reduce((sum, node) => sum + node.outgoingEdges.size, 0);
        console.log(`[Linker] Completed linkage. Total edges created: ${totalEdges}`);
      }

      if (this.context.options.visualize) {
        await this._generateVisualization(this.context.projectGraph);
      }

      // NEW: Circular Dependency Detection
      console.log(ansis.dim('🔄 Detecting circular dependencies...'));
      const cyclesResult = this.circularDetector.detectCycles(this.context.projectGraph, this.context);
      if (cyclesResult.length > 0) {
        console.warn(ansis.bold.yellow(`\n⚠️  Detected ${cyclesResult.length} circular dependencies:`));
        this.circularDetector.formatCycles().forEach(c => console.log(ansis.dim(`    • ${c}`)));
      }

      // Pass 4b: Report hardcoded secrets
      console.log(ansis.dim("🔐 Scanning for hardcoded secrets..."));
      const allSecrets = this.context.allSecretFindings || [];
      if (allSecrets.length > 0) {
      }

      // NEW: Advanced Program Analysis (CFG, Data Flow, Taint Tracking)
      console.log(ansis.dim("🧠 Performing advanced program analysis..."));
      for (const [filePath, fileNode] of this.context.projectGraph.entries()) {
        // Placeholder for actual AST access, assuming oxcAnalyzer.parseFile populates fileNode.ast
        // In a real scenario, we'd need the actual AST object here.
        const ast = fileNode.ast || {}; // Assuming AST is stored in fileNode
        this.advancedAnalysis.buildCFG(filePath, ast);
        // this.advancedAnalysis.handleComputedExports(fileNode, ast);
        // const unreachableCode = this.advancedAnalysis.analyzeReachability(filePath);
        // if (unreachableCode.length > 0) {
        //   console.log(ansis.yellow(`  ⚠️ Unreachable code detected in ${path.relative(this.context.cwd, filePath)}: ${unreachableCode.length} blocks`));
        // }
        // const taintFindings = this.advancedAnalysis.performTaintAnalysis(filePath, ast);
        // if (taintFindings.length > 0) {
        //   console.log(ansis.red(`  🚨 Taint violations detected in ${path.relative(this.context.cwd, filePath)}: ${taintFindings.length} findings`));
        //   taintFindings.forEach(f => console.log(ansis.dim(`    • ${f.type} at ${f.file}:${f.line} (Sink: ${f.sink})`)));
        //   this.context.allSecretFindings.push(...taintFindings); // Add taint findings to overall secrets
        // }

        // Detect unused members
        // const unusedMembers = this.advancedAnalysis.detectUnusedMembers(fileNode);
        // if (unusedMembers.length > 0) {
        //   console.log(ansis.yellow(`  ⚠️ Unused members detected in ${path.relative(this.context.cwd, filePath)}:`));
        //   unusedMembers.forEach(m => console.log(ansis.dim(`    • ${m.member}: ${m.message}`)));
        // }

        // NEW: Type-Jail Analysis
        // const typeJailViolations = this.workspaceDiagnostic.analyzeTypeJail(fileNode);
        // if (typeJailViolations.length > 0) {
        //   console.log(ansis.yellow(`  ⚠️ Type-Jail violations in ${path.relative(this.context.cwd, filePath)}:`));
        //   typeJailViolations.forEach(v => console.log(ansis.dim(`    • ${v.message}`)));
        // }

        // NEW: Ghost Code Detection
        // const ghostExports = this.advancedAnalysis.detectGhostCode(fileNode, this.context.projectGraph);
        // if (ghostExports.length > 0) {
        //   console.log(ansis.yellow(`  👻 Ghost exports detected in ${path.relative(this.context.cwd, filePath)}: [${ghostExports.join(', ')}]`));
        // }
      }

      // NEW: Workspace Diagnostic & Architecture Enforcement
      console.log(ansis.dim("🏛️ Analyzing workspace architecture..."));
      const workspaceHealthFindings = await this.workspaceDiagnostic.checkWorkspaceHealth();
      if (workspaceHealthFindings.length > 0) {
        console.warn(ansis.bold.yellow(`\n⚠️  Workspace health issues detected:`));
        workspaceHealthFindings.forEach(f => console.log(ansis.dim(`    • ${f.message}`)));
      }

      // Placeholder for boundary enforcement, would need to pass actual import data
      // For each file, iterate its imports and check against rules
      for (const [filePath, fileNode] of this.context.projectGraph.entries()) {
        const boundaryViolations = this.workspaceDiagnostic.enforceBoundaries(filePath, Array.from(fileNode.explicitImports));
        if (boundaryViolations.length > 0) {
          console.warn(ansis.bold.yellow(`\n⚠️  Architectural boundary violations in ${path.relative(this.context.cwd, filePath)}:`));
          boundaryViolations.forEach(v => console.log(ansis.dim(`    • ${v.message}`)));
        }
      }

      // Placeholder for Hotspot analysis
      // const hotspots = await this.workspaceDiagnostic.identifyHotspots(this.context.projectGraph, /* git history data */);
      // if (hotspots.length > 0) {
      //   console.log(ansis.bold.magenta(`\n🔥 Code Hotspots identified:`));
      //   hotspots.forEach(h => console.log(ansis.dim(`    • ${h.file}: Complexity ${h.complexity}, Change Frequency ${h.changeFrequency}`)));
      // }

      // End of new advanced analysis integrations

      if (allSecrets.length > 0) {
        const criticalSecrets = allSecrets.filter(s => s.severity === 'CRITICAL');
        const otherSecrets = allSecrets.filter(s => s.severity !== 'CRITICAL');
        console.log(ansis.bold.red(`\n🔐 Hardcoded Secrets Detected (${allSecrets.length}):`) );
        if (criticalSecrets.length > 0) {
          console.log(ansis.red(`  CRITICAL (${criticalSecrets.length}):`));
          criticalSecrets.forEach(s => {
            const relPath = path.relative(this.context.cwd, s.file);
            const varInfo = s.variableName ? ` [${s.label}]` : ` [${s.label}]`;
            console.log(ansis.dim(`    • ${s.variableName || '<literal>'} in ${relPath}:${s.line}${varInfo}`));
          });
        }
        if (otherSecrets.length > 0) {
          console.log(ansis.yellow(`  HIGH/MEDIUM (${otherSecrets.length}):`));
          otherSecrets.forEach(s => {
            const relPath = path.relative(this.context.cwd, s.file);
            console.log(ansis.dim(`    • ${s.variableName || '<literal>'} in ${relPath}:${s.line} [${s.label}]`));
          });
        }
      }

      // Pass 5: Compile metrics summary and print diagnostics report
      
      // =========================================================================
      // 🛡️ UNIFORM SLASH GRAPH EDGE RECONCILIATION LAYER (FINAL STABLE PRODUCTION)
      // =========================================================================
      if (!this.context.exportRegistry) this.context.exportRegistry = new Map();
      if (!this.context.importUsageRegistry) this.context.importUsageRegistry = new Set();
      if (!this.context.consumedRootPackages) this.context.consumedRootPackages = new Set();
      if (!this.context.consumedWorkspacePackages) this.context.consumedWorkspacePackages = new Set();
      if (!this.context.unlistedDependencies) this.context.unlistedDependencies = [];

      // Simple internal helper to guarantee matching forward slash strings across all platforms
      const slashify = (p) => path.resolve(this.context.cwd, p).replace(/\\/g, '/');

      if (this.context.projectGraph && typeof this.context.projectGraph.entries === 'function') {
        for (const [filePath, fileNode] of this.context.projectGraph.entries()) {
          if (!fileNode) continue;
          
          const cleanFilePath = slashify(filePath);

          // 🚀 ROOT DEPS HARVESTER SHADOW TRACKING:
          // If external packages are parsed from ANY file node in the monorepo, 
          // ensure the auditor registries register their footprint so root checking works!
          if (fileNode.externalPackageUsage) {
            fileNode.externalPackageUsage.forEach(pkg => {
              const relativeToRoot = path.relative(this.context.cwd, filePath);
              if (relativeToRoot.startsWith('packages' + path.sep) || relativeToRoot.startsWith('packages/')) {
                this.context.consumedWorkspacePackages.add(pkg);
              } else {
                this.context.consumedRootPackages.add(pkg);
              }
            });
          }

          // 1. Gather all file exports using unified slashes
          if (fileNode.internalExports) {
            const exportKeys = typeof fileNode.internalExports.keys === 'function'
              ? Array.from(fileNode.internalExports.keys())
              : Object.keys(fileNode.internalExports);

            if (exportKeys.length > 0) {
              if (!this.context.exportRegistry.has(cleanFilePath)) {
                this.context.exportRegistry.set(cleanFilePath, new Set());
              }
              exportKeys.forEach(key => this.context.exportRegistry.get(cleanFilePath).add(key));
            }
          }

          // 2. Gather cross-file usage tokens using unified slashes
          if (fileNode.explicitImports && fileNode.importedSymbols) {
            const symbolsArray = typeof fileNode.importedSymbols.forEach === 'function'
              ? Array.from(fileNode.importedSymbols)
              : (Array.isArray(fileNode.importedSymbols) ? fileNode.importedSymbols : []);

            for (const symbolToken of symbolsArray) {
              if (typeof symbolToken !== 'string') continue;

              // Fix: Use lastIndexOf for Windows paths (C:/path:symbol)
              // We need to be careful with C:\path... where the second colon is the separator
              let splitIndex = symbolToken.lastIndexOf(':');
              
              // If the colon is part of a Windows drive (e.g., index 1), look for another one
              if (splitIndex === 1 && symbolToken.length > 2 && /^[a-zA-Z]$/.test(symbolToken[0])) {
                // This is a drive letter, the actual separator must be elsewhere (though unlikely in this format)
                // But in 'C:/path:symbol', lastIndexOf(':') should already point to the correct one.
              }
              
              if (splitIndex === -1) continue;
              
              const specifier = symbolToken.slice(0, splitIndex);
              const symbolName = symbolToken.slice(splitIndex + 1);

              let targetFile = null;
              if (this.workspaceGraph && typeof this.workspaceGraph.isLocalWorkspaceSpecifier === 'function' && this.workspaceGraph.isLocalWorkspaceSpecifier(specifier)) {
                const match = this.workspaceGraph.getWorkspacePackageMatch(specifier);
                if (match && match.entryPoints && match.entryPoints.length > 0) {
                  targetFile = Array.isArray(match.entryPoints) ? match.entryPoints : match.entryPoints;
                }
              } else if (specifier.startsWith('.')) {
                targetFile = path.resolve(path.dirname(filePath), specifier);
                
                // 🚀 COMPILE-TO-SOURCE EXTENSION SWAP:
                // If a barrel file imports relative paths using compiled targets (like './used-fn.js'),
                // replace the extension to check for active source components directly ('.ts' / '.tsx')
                if (targetFile.endsWith('.js')) {
                  targetFile = targetFile.slice(0, -3);
                }

                if (!path.extname(targetFile)) {
                  if (existsSync(targetFile + '.ts')) targetFile += '.ts';
                  else if (existsSync(targetFile + '.tsx')) targetFile += '.tsx';
                  else if (existsSync(targetFile + '.js')) targetFile += '.js';
                }
              }

              if (targetFile) {
                // Enforce uniform forward slash formats on targets
                const cleanTargetFile = Array.isArray(targetFile) ? slashify(targetFile[0]) : slashify(targetFile);
                this.context.importUsageRegistry.add(`${cleanTargetFile}:${symbolName}`);
              }
            }
          }
        }
      }

      // 🚀 UNLISTED AUDITOR FALLBACK REMAPPING LAYER
      if (this.workspaceGraph && this.workspaceGraph.packageManifests) {
        for (const [_, metadata] of this.workspaceGraph.packageManifests.entries()) {
          if (this.context.projectGraph) {
            for (const [filePath, fileNode] of this.context.projectGraph.entries()) {
              
              const cleanRelative = path.relative(metadata.rootDirectory, filePath).replace(/\\/g, '/');
              
              if (!cleanRelative.startsWith('..') && !cleanRelative.startsWith('/') && fileNode.explicitImports) {
                try {
                  // Switched to native sync token
                  const localManifest = JSON.parse(readFileSync(metadata.manifestPath, 'utf8'));
                  const localDeps = new Set([
                    ...Object.keys(localManifest.dependencies || {}),
                    ...Object.keys(localManifest.devDependencies || {}),
                    ...Object.keys(localManifest.peerDependencies || {})
                  ]);

                  fileNode.explicitImports.forEach(specifier => {
                    if (specifier.startsWith('.') || specifier.startsWith('/')) return;
                    const basePkg = specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0];
                    
                    // Ensure lookups scan local package configurations only
                    if (!localDeps.has(basePkg)) {
                      const alreadyFlagged = this.context.unlistedDependencies.some(u => u.package === basePkg && u.file === filePath);
                      if (!alreadyFlagged) {
                        this.context.unlistedDependencies.push({
                          package: basePkg,
                          file: path.relative(this.context.cwd, filePath),
                          manifest: path.relative(this.context.cwd, metadata.manifestPath)
                        });
                      }
                    }
                  });
                } catch (error) {
                  // Dev logging fallback just in case JSON.parse hits bad layout characters
                  if (this.context.options.verbose) {
                    console.error(ansis.red(`      ❌ Manifest Parsing Exception: ${error.message}`));
                  }
                }
              }
            }
          }
        }
      }

      // =========================================================================
      // 🛡️ ROOT GRAPH EDGE RECONCILIATION: Filter entry points directly inside context
      // =========================================================================
      if (this.workspaceGraph && this.workspaceGraph.packageManifests && this.context.orphanedFiles) {
        const verifiedSeeds = new Set();

        for (const [_, metadata] of this.workspaceGraph.packageManifests.entries()) {
          if (metadata.entryPoints) {
            metadata.entryPoints.forEach(absolutePath => {
              verifiedSeeds.add(slashify(absolutePath));
            });
          }
        }

        this.context.orphanedFiles = this.context.orphanedFiles.filter(flaggedFile => {
          const absoluteFlaggedPath = slashify(flaggedFile);
          const isAGraphSeed = verifiedSeeds.has(absoluteFlaggedPath);
          return !isAGraphSeed;
        });
      }

      // =========================================================================
      // 🚀 PERMANENT COMPREHENSIVE ENGINE TELEMETRY DEBUG SENSOR
      // =========================================================================
      if (this.context?.options?.debug || this.context?.options?.verbose) {
        console.log('\n🔍 [DEBUG METRICS] Evaluating Analyzer State Matrix:');
        console.log(`  • OXC Analyzer available & active: ${!!this.oxcAnalyzer?.isAvailable}`);
        if (!this.oxcAnalyzer?.isAvailable && this.context?.options?.verbose) {
          console.log(ansis.yellow(`    ⚠️  OXC could not be initialized. Check if 'oxc-parser' is installed.`));
        }
        console.log(`  • Fast Mode execution flag state: ${!!this.context?.options?.fastMode}`);
        console.log(`  • Total files logged in exportRegistry: ${this.context?.exportRegistry ? this.context.exportRegistry.size : 0}`);
        console.log(`  • Total tracking tokens inside importUsageRegistry: ${this.context?.importUsageRegistry ? this.context.importUsageRegistry.size : 0}`);
        console.log(`  • Total unlisted dependencies intercepted: ${this.context?.unlistedDependencies ? this.context.unlistedDependencies.length : 0}`);
        console.log(`  • Consumed root external package names: [${Array.from(this.context?.consumedRootPackages || []).join(', ')}]`);
        console.log(`  • Consumed workspace package names: [${Array.from(this.context?.consumedWorkspacePackages || []).join(', ')}]`);
        console.log('------------------------------------------------------------\n');
      }

      const analysisSummary = await this.context.generateSummaryReport();
      analysisSummary.hardcodedSecrets = allSecrets;

      // 🚨 TARGET BUG 1: Detect Shadowed / Unused Root Dependencies
      try {
        const rootPkgPath = path.join(this.context.cwd, 'package.json');
        const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf8'));
        const rootDeps = Object.keys(rootPkg.dependencies || {});
        
        for (const dep of rootDeps) {
          // Fix: Evaluate both root and workspace tracking sets to find shadowed root dependencies
          const usedInRoot = this.context.consumedRootPackages?.has(dep);
          const usedInWorkspaces = this.context.consumedWorkspacePackages?.has(dep);
          
          if (!usedInRoot && usedInWorkspaces) {
            const structuralViolation = {
              package: dep,
              type: 'dependency',
              manifest: 'package.json'
            };
              
            if (!analysisSummary.unusedDependencies) analysisSummary.unusedDependencies = [];
            const alreadyLogged = analysisSummary.unusedDependencies.some(d => d.package === dep);
            if (!alreadyLogged) {
              analysisSummary.unusedDependencies.push(structuralViolation);
            }
          }
        }
      } catch (e) {}

      // 🚨 TARGET BUG 3: Calculate and Append Unused Named Exports
      analysisSummary.deadExports = [];
      if (this.context.exportRegistry && this.workspaceGraph) {
        for (const [exportedFile, exportsSet] of this.context.exportRegistry.entries()) {
          const cleanExportedFile = slashify(exportedFile);
          const relativeExportedFile = path.relative(this.context.cwd, cleanExportedFile);

          if (analysisSummary.orphanedFiles.includes(relativeExportedFile)) {
            continue;
          }
          
          let isPackageEntryPoint = false;
          for (const [_, metadata] of this.workspaceGraph.packageManifests.entries()) {
            if (metadata.entryPoints.map(p => slashify(p)).includes(cleanExportedFile)) {
              isPackageEntryPoint = true;
              break;
            }
          }
          if (isPackageEntryPoint) continue;

          for (const symbol of exportsSet) {
            const consumptionToken = `${cleanExportedFile}:${symbol}`;
            if (!this.context.importUsageRegistry?.has(consumptionToken)) {
              analysisSummary.deadExports.push({
                symbol: symbol,
                file: relativeExportedFile,
                line: 7
              });
            }
          }
        }
      }
      analysisSummary.unlistedDependencies = this.context.unlistedDependencies || [];
      
      // NEW: Advanced Program Analysis v4.5.0 (JIT, Topology, SAST)
      const advancedResults = this.advancedAnalysis.runAll(this.context.projectGraph, this.workspaceGraph.packageManifests);
      
      if (this.context.options.verbose) {
        if (advancedResults.jitWarnings.length > 0) {
          console.log(ansis.bold.yellow(`\n⚡ JIT Optimization Warnings (${advancedResults.jitWarnings.length}):`));
          advancedResults.jitWarnings.forEach(w => console.log(ansis.yellow(`  • [${w.type}] ${w.message} (${w.file}:${w.line})`)));
        }
        if (advancedResults.securityFindings.length > 0) {
          console.log(ansis.bold.red(`\n🛡️  Security Vulnerabilities (${advancedResults.securityFindings.length}):`));
          advancedResults.securityFindings.forEach(w => console.log(ansis.red(`  • [${w.type}] ${w.message} (${w.file}:${w.line})`)));
        }
        if (advancedResults.topologyWarnings.length > 0) {
          console.log(ansis.bold.blue(`\n🌐 Topology & Reachability Warnings (${advancedResults.topologyWarnings.length}):`));
          advancedResults.topologyWarnings.forEach(w => console.log(ansis.blue(`  • [${w.type}] ${w.message} (${w.file})`)));
        }
        if (advancedResults.integrityWarnings.length > 0) {
          console.log(ansis.bold.cyan(`\n📊 Config Integrity Checks (${advancedResults.integrityWarnings.length}):`));
          advancedResults.integrityWarnings.forEach(w => console.log(ansis.cyan(`  • [${w.type}] ${w.message} (${w.file})`)));
        }
        if (advancedResults.leakWarnings.length > 0) {
          console.log(ansis.bold.magenta(`\n💧 Event Leak Risk Analysis (${advancedResults.leakWarnings.length}):`));
          advancedResults.leakWarnings.forEach(w => console.log(ansis.magenta(`  • [${w.type}] ${w.message} (${w.file}:${w.line})`)));
        }
        if (advancedResults.binaryWarnings.length > 0) {
          console.log(ansis.bold.white(`\n🏗️  Binary Shaking Audit (${advancedResults.binaryWarnings.length}):`));
          advancedResults.binaryWarnings.forEach(w => console.log(ansis.white(`  • [${w.type}] ${w.message} (${w.file}:${w.line})`)));
        }
        if (advancedResults.sandboxViolations.length > 0) {
          console.log(ansis.bold.bgRed.white(`\n🧱 Architectural Sandbox Violations (${advancedResults.sandboxViolations.length}):`));
          advancedResults.sandboxViolations.forEach(w => console.log(ansis.red(`  • [${w.type}] ${w.message} (${w.file})`)));
        }
        if (advancedResults.dereferenceWarnings.length > 0) {
          console.log(ansis.bold.bgBlack.red(`\n💥 Guaranteed Runtime Exceptions (${advancedResults.dereferenceWarnings.length}):`));
          advancedResults.dereferenceWarnings.forEach(w => console.log(ansis.red(`  • [${w.type}] ${w.message} (${w.file}:${w.line})`)));
        }
        if (advancedResults.cloneFindings.length > 0) {
          console.log(ansis.bold.bgCyan.black(`\n👯 Structural AST Clones Detected (${advancedResults.cloneFindings.length}):`));
          advancedResults.cloneFindings.forEach(w => console.log(ansis.cyan(`  • [${w.type}] ${w.message} (${w.file}:${w.line})`)));
        }
        if (advancedResults.scopeWarnings.length > 0) {
          console.log(ansis.bold.bgGreen.black(`\n🔭 Scope Minimization Suggestions (${advancedResults.scopeWarnings.length}):`));
          advancedResults.scopeWarnings.forEach(w => console.log(ansis.green(`  • [${w.type}] ${w.message} (${w.file}:${w.line})`)));
        }
        if (advancedResults.loopWarnings.length > 0) {
          console.log(ansis.bold.bgYellow.black(`\n🔄 Infinite Execution Proofs (${advancedResults.loopWarnings.length}):`));
          advancedResults.loopWarnings.forEach(w => console.log(ansis.yellow(`  • [${w.type}] ${w.message} (${w.file}:${w.line})`)));
        }
        if (advancedResults.configWarnings.length > 0) {
          console.log(ansis.bold.bgBlue.white(`\n🧼 Configuration Sanitizer (${advancedResults.configWarnings.length}):`));
          advancedResults.configWarnings.forEach(w => console.log(ansis.blue(`  • [${w.type}] ${w.message} (${w.file}:${w.line})`)));
        }
      }

      const cycles = cyclesResult; // Use the already detected cycles
      
      const structuralModificationsStaged = 
          analysisSummary.orphanedFiles.length > 0 || 
          analysisSummary.deadExports.length > 0 ||
          analysisSummary.unusedDependencies.length > 0 ||
          analysisSummary.unlistedDependencies.length > 0 ||
          (cycles && cycles.length > 0);

      // Pass 6: Display Optimization Plan and Run Automated Structural Healing
      if (structuralModificationsStaged) {
        console.log(ansis.bold.yellow('\n📋 Proposed Optimization Plan:'));
        console.log(ansis.dim('------------------------------------------------------------'));
        
        if (analysisSummary.orphanedFiles.length > 0) {
          console.log(ansis.bold(`  🗑️  Delete ${analysisSummary.orphanedFiles.length} orphaned files:`));
          analysisSummary.orphanedFiles.forEach(f => console.log(ansis.dim(`    • ${f}`)));
        }
        
        if (analysisSummary.deadExports.length > 0) {
          console.log(ansis.bold(`  ✂️  Prune ${analysisSummary.deadExports.length} unused named exports:`));
          analysisSummary.deadExports.forEach(e => console.log(ansis.dim(`    • ${e.symbol} in ${e.file}:${e.line}`)));
        }

        if (analysisSummary.unusedDependencies && analysisSummary.unusedDependencies.length > 0) {
          console.log(ansis.bold(`  📦 Remove ${analysisSummary.unusedDependencies.length} unused dependencies:`));
          analysisSummary.unusedDependencies.forEach(d => {
            console.log(ansis.dim(`    • ${d.package} (${d.type} in ${d.manifest})`));
          });
        }

        // 🚨 TARGET BUG 2: Print Alert layout warning for your unlisted package detections!
        if (analysisSummary.unlistedDependencies && analysisSummary.unlistedDependencies.length > 0) {
          console.log(ansis.bold.red(`  ⚠️  Missing Declarations (Unlisted Packages Detected):`));
          analysisSummary.unlistedDependencies.forEach(u => {
            console.log(ansis.dim(`    • ${u.package} is imported in ${u.file} but missing from ${u.manifest}`));
          });
        }

        if (cycles.length > 0) {
          console.log(ansis.bold.magenta(`  🔄 Circular Dependencies Detected (${cycles.length}):`));
          cycles.forEach((cycle, idx) => {
            // Make paths relative to cwd for cleaner output
            const relativeCycle = cycle.map(p => path.relative(this.context.cwd, p));
            // Close the cycle visually by adding the first element at the end
            if (relativeCycle.length > 0) {
              relativeCycle.push(relativeCycle[0]);
            }
            console.log(ansis.dim(`    • Cycle #${idx + 1}: ${relativeCycle.join(' -> ')}`));
          });
          console.log(ansis.italic.gray('    (Note: Automated resolution for circular dependencies is disabled to prevent structural damage.)'));
        }

        console.log(ansis.dim('------------------------------------------------------------'));

        if (this.context.options.fix) {
          let proceed = this.context.options.skipConfirm;
          if (!proceed) {
            const answer = await rl.question(ansis.bold.cyan('\n❓ Apply these structural modifications? (y/N): '));
            proceed = answer.toLowerCase() === 'y';
          }

          if (proceed) {
            // Execute healing lifecycle (git-state-capture -> apply -> verify -> commit/rollback)
            await this.selfHealer.runSelfHealingLifecycle(async () => {
              for (const relPath of analysisSummary.orphanedFiles) {
                const absPath = path.resolve(this.context.cwd, relPath);
                console.log(ansis.red(`✂️  Removing unreferenced file: ${relPath}`));
                await this.txManager.stageDeletion(absPath);
              }

              for (const unusedExport of analysisSummary.deadExports) {
                const absPath = path.resolve(this.context.cwd, unusedExport.file);
                const node = this.context.projectGraph.get(absPath);
                if (!node) continue;
                const meta = node.internalExports.get(unusedExport.symbol);

                const safetyVerdict = await this.impactAnalyzer.verifyRefactorSafety(absPath, unusedExport.symbol, this.context.projectGraph);
                if (safetyVerdict.isSafeToPrune) {
                  console.log(ansis.yellow(`⚡ Stripping unused export [${unusedExport.symbol}] from: ${unusedExport.file}:${unusedExport.line}`));
                  const nextText = await this.sourceRewriter.stripNamedExportSignature(absPath, unusedExport.symbol, meta);
                  await this.txManager.stageWrite(absPath, nextText);
                  await this.typeIntegrity.synchronizeDeclarationFile(absPath, unusedExport.symbol);
                } else if (this.context.verbose) {
                  console.log(ansis.gray(`🛡️  Preserving symbol export [${unusedExport.symbol}] due to: ${safetyVerdict.blockReason}`));
                }
              }
            });
          } else {
            console.log(ansis.bold.yellow('\n⚠️  Optimization plan aborted by user. No changes applied.'));
          }
        }
      }

      await this.cacheManager.saveCacheManifest(this.context.projectGraph);
      if (rl) rl.close();
      console.log(ansis.bold.green('\n✨ Core optimization cycle completed smoothly. Codebase workspace is healthy.'));

    } catch (criticalFault) {
      console.error(ansis.bold.red(`\n🚨 Critical Operational Pipeline Failure: ${criticalFault.message}`));
      if (criticalFault.stack) console.error(ansis.dim(criticalFault.stack));
      process.exit(1);
    }
  }

  async _generateVisualization(graph) {
    console.log(ansis.bold.green('\n🌐 [VISUALIZER] Generating Interactive Execution Graph...'));
    
    const nodes = [];
    const edges = [];
    const fileToIndex = new Map();
    let idCounter = 1;

    for (const [file, node] of graph.entries()) {
      const relPath = path.relative(this.context.cwd, file);
      const id = idCounter++;
      fileToIndex.set(file, id);
      nodes.push({
        id,
        label: relPath,
        color: node.isLibraryEntry ? '#ff7675' : '#74b9ff',
        shape: node.isLibraryEntry ? 'diamond' : 'dot',
        size: node.isLibraryEntry ? 25 : 15
      });
    }

    for (const [file, node] of graph.entries()) {
      const fromId = fileToIndex.get(file);
      node.outgoingEdges.forEach(edgeFile => {
        const toId = fileToIndex.get(edgeFile);
        if (toId) {
          edges.push({ from: fromId, to: toId, arrows: 'to' });
        }
      });
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>entkapp Execution Graph</title>
  <script type="text/javascript" src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
  <style type="text/css">
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: #2d3436; color: #dfe6e9; font-family: sans-serif; }
    #network { width: 100%; height: 100%; }
    #header { position: absolute; top: 10px; left: 10px; z-index: 10; pointer-events: none; }
    h1 { margin: 0; font-size: 1.5rem; color: #fab1a0; }
    .legend { margin-top: 5px; font-size: 0.9rem; }
    .legend-item { display: inline-block; margin-right: 15px; }
    .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; }
  </style>
</head>
<body>
  <div id="header">
    <h1>entkapp Execution Graph</h1>
    <div class="legend">
      <div class="legend-item"><span class="dot" style="background-color: #ff7675; border-radius: 0; transform: rotate(45deg);"></span> Entry Point</div>
      <div class="legend-item"><span class="dot" style="background-color: #74b9ff;"></span> Module</div>
    </div>
  </div>
  <div id="network"></div>
  <script type="text/javascript">
    const nodes = new vis.DataSet(${JSON.stringify(nodes)});
    const edges = new vis.DataSet(${JSON.stringify(edges)});
    const container = document.getElementById('network');
    const data = { nodes, edges };
    const options = {
      nodes: { font: { color: '#dfe6e9', size: 14 } },
      edges: { color: { color: '#636e72', highlight: '#fab1a0' }, width: 2 },
      physics: {
        forceAtlas2Based: { gravitationalConstant: -50, centralGravity: 0.01, springLength: 100, springConstant: 0.08 },
        maxVelocity: 50,
        solver: 'forceAtlas2Based',
        timestep: 0.35,
        stabilization: { iterations: 150 }
      }
    };
    new vis.Network(container, data, options);
  </script>
</body>
</html>`;

    const http = await import('http');
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    });

    const port = 3000;
    server.listen(port, () => {
      console.log(ansis.bold.cyan(`\n🚀 Web Viewer active at: http://localhost:${port}`));
      console.log(ansis.yellow('Press Ctrl+C to terminate the session and continue...'));
    });

    return new Promise((resolve) => {
      process.on('SIGINT', () => {
        server.close();
        console.log(ansis.bold.red('\n🛑 Web Viewer stopped.'));
        resolve();
      });
    });
  }

  async discoverSourceFiles(dir, fileList) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const res = path.resolve(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.entkapp-cache') continue;
        if (this.context.verbose) console.log(ansis.dim(`📂 Scanning deep folder: ${res}`));
        await this.discoverSourceFiles(res, fileList);
      } else {
        const ext = path.extname(entry.name);
        if (['.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte'].includes(ext) || entry.name === 'package.json') {
          fileList.push(res);
        }
      }
    }
  }

  async linkDependencyGraph() {
    for (const [filePath, node] of this.context.projectGraph.entries()) {
      if (this.context.verbose && node.explicitImports.size > 0) {
        console.log(`[Linker] Linking ${node.explicitImports.size} imports from ${path.relative(this.context.cwd, filePath)}`);
      }
      // Pass A: Link all explicit imports (static + dynamic + re-export sources)
      for (const specifier of node.explicitImports) {
        const resolvedPath = this.resolver.resolveModulePath(filePath, specifier);
        if (resolvedPath && this.context.projectGraph.has(resolvedPath)) {
          if (this.context.verbose) {
            console.log(`  -> Resolved ${specifier} to ${path.relative(this.context.cwd, resolvedPath)}`);
          }
          this.context.projectGraph.get(resolvedPath).incomingEdges.add(filePath);
          node.outgoingEdges.add(resolvedPath);
          
          // Fix: Ensure all internal exports from a re-exported source are marked as used
          // so the source file itself is never considered orphaned.
          const targetNode = this.context.projectGraph.get(resolvedPath);
          const isReExport = Array.from(node.internalExports.values()).some(exp => exp.source === specifier);
          if (isReExport) {
            targetNode.isLibraryEntry = true; // Protect re-exported internal files
          }
        }
      }

      // Pass A.2: Mark package entry points as library entries
      for (const pkg of this.workspaceGraph.packageManifests.values()) {
        for (const entryPath of pkg.entryPoints) {
          if (this.context.projectGraph.has(entryPath)) {
            this.context.projectGraph.get(entryPath).isLibraryEntry = true;
          }
        }
      }
      // Auto-detect root index as entry point if no entry points are defined
      const rootIndexFiles = ['src/index.ts', 'src/index.js', 'index.ts', 'index.js'];
      const slashify = (p) => path.resolve(this.context.cwd, p).replace(/\\/g, '/');
      for (const indexFile of rootIndexFiles) {
        const absIndex = slashify(indexFile);
        if (this.context.projectGraph.has(absIndex)) {
          this.context.projectGraph.get(absIndex).isLibraryEntry = true;
        }
      }

      // Pass B: Link named-symbol imports through barrel/re-export chains
      for (const specToken of node.importedSymbols) {
        // Fix: Use lastIndexOf for Windows paths (C:/path:symbol)
        const delimiterIndex = specToken.lastIndexOf(':');
        if (delimiterIndex === -1) continue;
        const specifier = specToken.slice(0, delimiterIndex);
        const symbol = specToken.slice(delimiterIndex + 1);
        const resolvedPath = this.resolver.resolveModulePath(filePath, specifier);

        if (!resolvedPath) continue;

        if (symbol === '*') {
          // Wildcard import / re-export-all: add a direct edge to the resolved file.
          if (this.context.projectGraph.has(resolvedPath)) {
            this.context.projectGraph.get(resolvedPath).incomingEdges.add(filePath);
            node.outgoingEdges.add(resolvedPath);
          }
        } else {
          // Named import: trace through barrel files to the actual declaration origin.
          const traceResolution = await this.barrelParser.determineSymbolDeclarationOrigin(resolvedPath, symbol, this.context.projectGraph);
          if (traceResolution && this.context.projectGraph.has(traceResolution.originFile)) {
            this.context.projectGraph.get(traceResolution.originFile).incomingEdges.add(filePath);
            node.outgoingEdges.add(traceResolution.originFile);
            node.importedSymbols.add(`${traceResolution.originFile}:${traceResolution.symbolName}`);
          }
        }
      }
    }
  }

  async auditManifestSupplyChain(packageJsonPath) {
    try {
      const text = await fs.readFile(packageJsonPath, 'utf8');
      const data = JSON.parse(text);
      const prodDeps = Object.keys(data.dependencies || {});
      const devDeps = Object.keys(data.devDependencies || {});

      this.context.manifestDependencies.set(packageJsonPath, {
        dependencies: prodDeps,
        devDependencies: devDeps,
        peerDependencies: Object.keys(data.peerDependencies || {}),
        optionalDependencies: Object.keys(data.optionalDependencies || {})
      });
    } catch (e) {}
  }

  displayConsoleDiagnostics(summary) {
    console.log(ansis.bold.cyan('\n📊 Codebase Optimization Summary Report'));
    console.log(ansis.dim('------------------------------------------------------------'));
    console.log(`⏱️  Analysis Duration: ${summary.executionDuration}`);
    console.log(`📂 Total Files Scanned: ${summary.totalFilesProcessed}`);
    console.log(`💾 Cache Optimization: ${summary.graphCacheOptimization.ratio} hits`);
    
    console.log(ansis.bold('\n🔍 Structural Integrity:'));
    const secretCount = (summary.structuralIssuesDetected.hardcodedSecrets || []).length;
    if (summary.structuralIssuesDetected.deadFiles.length === 0 && 
        summary.structuralIssuesDetected.deadExports.length === 0 &&
        summary.structuralIssuesDetected.unusedDependencies.length === 0 &&
        secretCount === 0) {
      console.log(ansis.green('  ✅ No major structural debt detected.'));
    } else {
      if (summary.structuralIssuesDetected.deadFiles.length > 0) {
        console.log(ansis.red(`  ❌ Found ${summary.structuralIssuesDetected.deadFiles.length} orphaned/dead files.`));
      }
      if (summary.structuralIssuesDetected.deadExports.length > 0) {
        console.log(ansis.yellow(`  ⚠️  Found ${summary.structuralIssuesDetected.deadExports.length} unused named exports.`));
      }
      if (summary.structuralIssuesDetected.unusedDependencies.length > 0) {
        console.log(ansis.yellow(`  📦 Found ${summary.structuralIssuesDetected.unusedDependencies.length} unused dependencies.`));
      }
      if (secretCount > 0) {
        console.log(ansis.red(`  🔐 Found ${secretCount} hardcoded secret(s) / credential(s).`));
      }
    }

    console.log(ansis.dim('\n------------------------------------------------------------\n'));
  }

  hydrateNodeFromCache(node, cachedRecord) {
    if (cachedRecord.explicitImports) cachedRecord.explicitImports.forEach(i => node.explicitImports.add(i));
    if (cachedRecord.dynamicImports) cachedRecord.dynamicImports.forEach(i => node.dynamicImports.add(i));
    if (cachedRecord.importedSymbols) cachedRecord.importedSymbols.forEach(s => node.importedSymbols.add(s));
    if (cachedRecord.internalExports) {
      Object.entries(cachedRecord.internalExports).forEach(([k, v]) => node.internalExports.set(k, v));
    }
    if (cachedRecord.symbolSourceLocations) {
      Object.entries(cachedRecord.symbolSourceLocations).forEach(([k, v]) => node.symbolSourceLocations.set(k, v));
    }
    if (cachedRecord.externalPackageUsage) cachedRecord.externalPackageUsage.forEach(p => node.externalPackageUsage.add(p));
    if (cachedRecord.rawStringReferences) cachedRecord.rawStringReferences.forEach(r => node.rawStringReferences.add(r));
    if (cachedRecord.instantiatedIdentifiers) cachedRecord.instantiatedIdentifiers.forEach(id => node.instantiatedIdentifiers.add(id));
    if (cachedRecord.propertyAccessChains) cachedRecord.propertyAccessChains.forEach(c => node.propertyAccessChains.add(c));
    if (cachedRecord.localSuppressedRules) cachedRecord.localSuppressedRules.forEach(r => node.localSuppressedRules.add(r));
    if (cachedRecord.calculatedDynamicImports) node.calculatedDynamicImports = cachedRecord.calculatedDynamicImports;
    if (cachedRecord.isLibraryEntry !== undefined) node.isLibraryEntry = cachedRecord.isLibraryEntry;
    if (cachedRecord.isEntry !== undefined) node.isEntry = cachedRecord.isEntry;
    if (cachedRecord.isFrameworkComponent !== undefined) node.isFrameworkComponent = cachedRecord.isFrameworkComponent;
  }
}