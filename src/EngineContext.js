import fs from 'fs/promises';
import path from 'path';

/**
 * Structural Blueprint for an Isolated Codebase Component Node
 */
class GraphNode {
  constructor(filePath) {
    this.filePath = filePath;
    this.contentHash = '';
    this.isLibraryEntry = false;
    
    // Explicit and Computed Dynamic Syntax Boundaries
    this.explicitImports = new Set();
    this.dynamicImports = new Set();
    this.importedSymbols = new Set(); // Format: 'specifier:symbol' or 'specifier:*'
    
    // Internal API Exposed Interfaces (Name -> ExportMetadata)
    this.internalExports = new Map();
    this.typeOnlyExports = new Set();
    
    // Semantic Reference Verification Registries
    this.instantiatedIdentifiers = new Set();
    this.rawStringReferences = new Set();
    this.propertyAccessChains = new Set();
    
    // Dependency Mesh Connection Maps
    this.incomingEdges = new Set(); // Set of absolute filePaths depending on this component
    this.resolvedInternalTargets = new Set(); // Set of absolute internal filePaths this component calls
    
    // Security & Compliance Anomaly Matrices
    this.securityThreats = [];
    this.calculatedDynamicImports = [];
    this.localSuppressedRules = new Set();
  }

  /**
   * Evaluates if a specific exposed symbol token is utilized by any incoming edges.
   */
  isSymbolReferencedExternally(symbolName, projectGraph) {
    if (this.isLibraryEntry) return true;
    
    for (const parentPath of this.incomingEdges) {
      const parentNode = projectGraph.get(parentPath);
      if (!parentNode) continue;

      // Direct binding match checks
      if (parentNode.instantiatedIdentifiers.has(symbolName)) return true;
      if (parentNode.rawStringReferences.has(symbolName)) return true;

      // Access chain matches (e.g., namespace.symbol)
      for (const chain of parentNode.propertyAccessChains) {
        if (chain.endsWith(`.${symbolName}`) || chain.includes(`.${symbolName}.`)) {
          return true;
        }
      }
    }
    return false;
  }
}

/**
 * Enterprise In-Memory Codebase State Manifest Container
 * Handles suppression heuristic compilation and lifecycle log formatting.
 */
export class EngineContext {
  constructor(options = {}) {
    this.cwd = path.normalize(options.cwd || process.cwd());
    this.cacheDir = path.join(this.cwd, '.scaffold-cache');
    this.ignoreFilePath = path.join(this.cwd, '.scaffold-ignore');
    this.tsconfigFilename = options.tsconfig || 'tsconfig.json';
    this.testCommand = options.testCommand || 'npm test';
    
    this.allowAutoFix = options.autoFix ?? true;
    this.isWorkspaceEnabled = options.workspace ?? false;
    this.verbose = options.verbose ?? false;

    // Core Memory Repositories
    this.graph = new Map(); // Absolute Path -> GraphNode
    this.registryHashes = new Map(); // Declared Module Name -> Registry Integrity String
    this.globallyIgnoredSymbols = new Set();
    this.globallyIgnoredPaths = [];
    
    // Performance Analytics Trackers
    this.metrics = {
      startTime: 0,
      endTime: 0,
      totalFilesScanned: 0,
      cacheHits: 0,
      cacheMisses: 0,
      prunedFilesCount: 0,
      prunedExportsCount: 0
    };
  }

  /**
   * Initializes context variables, directory configurations, and exclusion sheets.
   */
  async initialize() {
    this.metrics.startTime = Date.now();
    await fs.mkdir(this.cacheDir, { recursive: true });
    await this.compileIgnoreConfigurations();
  }

  /**
   * Parses .scaffold-ignore sheets and maps global exclusion profiles.
   */
  async compileIgnoreConfigurations() {
    try {
      const content = await fs.readFile(this.ignoreFilePath, 'utf8');
      const lines = content.split('\n');

      for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#')) continue;

        if (line.startsWith('export:')) {
          const symbolToken = line.replace('export:', '').trim();
          this.globallyIgnoredSymbols.add(symbolToken);
        } else {
          // Normalize paths for cross-platform glob checking
          const normalizedPattern = line.replace(/\\/g, '/');
          this.globallyIgnoredPaths.push(new RegExp(
            '^' + normalizedPattern
              .replace(/\./g, '\\.')
              .replace(/\*/g, '.*') + '$'
          ));
        }
      }
    } catch {
      // Ignore file optionally omitted by worker profiles; bypass gracefully
    }
  }

  /**
   * Spawns a new file component node in our graph memory map.
   */
  createNode(absoluteFilePath) {
    const normalizedPath = path.normalize(absoluteFilePath);
    if (this.graph.has(normalizedPath)) {
      return this.graph.get(normalizedPath);
    }
    const node = new GraphNode(normalizedPath);
    this.graph.set(normalizedPath, node);
    return node;
  }

  /**
   * Checks if an absolute system file path matches our project configuration ignore rules.
   */
  isPathIgnored(absoluteFilePath) {
    const relativeText = path.relative(this.cwd, absoluteFilePath).replace(/\\/g, '/');
    return this.globallyIgnoredPaths.some(pattern => pattern.test(relativeText));
  }

  /**
   * Compiles diagnostic feedback maps tracking architecture alerts and orphan metrics.
   */
  generateSummaryReport() {
    this.metrics.endTime = Date.now();
    const durationSeconds = ((this.metrics.endTime - this.metrics.startTime) / 1000).toFixed(2);
    
    const summary = {
      executionDuration: `${durationSeconds}s`,
      totalFilesProcessed: this.metrics.totalFilesScanned,
      graphCacheOptimization: {
        hits: this.metrics.cacheHits,
        misses: this.metrics.cacheMisses,
        ratio: this.metrics.totalFilesScanned > 0 
          ? `${((this.metrics.cacheHits / this.metrics.totalFilesScanned) * 100).toFixed(1)}%`
          : '0%'
      },
      structuralIssuesDetected: {
        deadFiles: [],
        deadExports: [],
        securityThreats: []
      },
      modificationsExecuted: {
        filesUnlinked: this.metrics.prunedFilesCount,
        exportsStripped: this.metrics.prunedExportsCount
      }
    };

    for (const [filePath, node] of this.graph.entries()) {
      const relativePath = path.relative(this.cwd, filePath);

      // Check for orphan files (no parent dependencies and not an entry point)
      if (node.incomingEdges.size === 0 && !node.isLibraryEntry && !this.isPathIgnored(filePath)) {
        summary.structuralIssuesDetected.deadFiles.push(relativePath);
      }

      // Check for unused named exports inside active files
      for (const [exportName, meta] of node.internalExports.entries()) {
        if (exportName === 'default' || this.globallyIgnoredSymbols.has(exportName) || node.localSuppressedRules.has(exportName)) {
          continue;
        }
        
        if (!node.isSymbolReferencedExternally(exportName, this.graph)) {
          summary.structuralIssuesDetected.deadExports.push({
            file: relativePath,
            symbol: exportName,
            type: meta.type,
            offset: meta.start
          });
        }
      }

      // Collect security credentials leaks
      if (node.securityThreats && node.securityThreats.length > 0) {
        node.securityThreats.forEach(threat => {
          summary.structuralIssuesDetected.securityThreats.push({
            file: relativePath,
            identifier: threat.variableKey,
            riskCode: threat.riskCode || 'HIGH_RISK_SECRET_LEAK',
            entropy: threat.entropyValue
          });
        });
      }
    }

    return summary;
  }
}
