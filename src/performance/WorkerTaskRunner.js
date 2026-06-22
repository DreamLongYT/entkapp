import { parentPort, workerData } from 'worker_threads';
import fs from 'fs/promises';
import { ASTAnalyzer } from '../ast/ASTAnalyzer.js';
import { OxcAnalyzer } from '../ast/OxcAnalyzer.js';

/**
 * Worker Thread Execution Script
 * Handles parallel AST parsing for a chunk of files and returns serialized results.
 * Diamond Edition: Upgraded with path-isolated scope registers and type-safe serialization guards.
 */
async function runTask() {
  const { files, contextOptions } = workerData;
  const results = [];

  // UPGRADE: Reconstruct alias/workspace filter helpers from serialized contextOptions
  // These are passed from WorkerPool.executeChunkInsideThread so workers can skip false positives
  const aliasRegexes = (contextOptions.aliasPatternSources || []).map(src => {
    try { return new RegExp(src); } catch { return null; }
  }).filter(Boolean);
  const workspacePackageSet = new Set(contextOptions.workspacePackageNames || []);

  // Lightweight helpers mirroring PathMapper.isTsconfigAlias and WorkspaceGraph.isLocalWorkspaceSpecifier
  const isTsconfigAlias = (spec) => aliasRegexes.some(r => r.test(spec));
  const isWorkspacePkg = (spec) => {
    if (workspacePackageSet.has(spec)) return true;
    for (const name of workspacePackageSet) { if (spec.startsWith(name + '/')) return true; }
    return false;
  };

  // Create a minimal context for analyzers
  const mockContext = {
    verbose: contextOptions.verbose,
    cwd: contextOptions.cwd || process.cwd(),
    projectGraph: new Map(),
    // UPGRADE: Expose lightweight alias/workspace helpers so ASTAnalyzer can filter imports
    pathMapper: {
      isTsconfigAlias,
      _aliasPatterns: aliasRegexes.map(r => ({ regex: r }))
    },
    workspaceGraph: {
      isLocalWorkspaceSpecifier: isWorkspacePkg,
      workspacePackages: workspacePackageSet
    },
    getOrCreateNode: (path) => ({
      filePath: path,
      explicitImports: new Set(),
      dynamicImports: new Set(),
      importedSymbols: new Set(),
      rawStringReferences: new Set(),
      instantiatedIdentifiers: new Set(),
      propertyAccessChains: new Set(),
      internalExports: new Map(),
      securityThreats: [],
      localSuppressedRules: new Set(),
      externalPackageUsage: new Set(),
      symbolSourceLocations: new Map(),
      jsxComponents: new Set(),
      jsxProps: new Set(),
      decorators: new Set(),
      isFrameworkContract: false,
      isEntry: false,
      isLibraryEntry: false,
      isFrameworkComponent: false,
      calculatedDynamicImports: [],
      globImports: []
    })
  };

  const astAnalyzer = new ASTAnalyzer(mockContext);
  const oxcAnalyzer = new OxcAnalyzer(mockContext);
  await oxcAnalyzer.init();

  for (const filePath of files) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const node = mockContext.getOrCreateNode(filePath);
      node.rawCode = content; // UPGRADE: Add raw code to node for plugin analysis in main thread

      // Defensiver Check: Sicherstellen, dass die Map/Set-Instanzen sauber existieren
      if (!(node.internalExports instanceof Map)) node.internalExports = new Map();
      if (!(node.explicitImports instanceof Set)) node.explicitImports = new Set();
      if (!(node.dynamicImports instanceof Set)) node.dynamicImports = new Set();
      if (!(node.importedSymbols instanceof Set)) node.importedSymbols = new Set();

      // Use OXC if available, fallback to TS AST
      let success = false;
      try {
        if (oxcAnalyzer.isAvailable) {
          success = await oxcAnalyzer.parseFile(filePath, content, node);
        }
      } catch (oxcError) {
        success = false; // Catch error to force TS fallback
      }
      
      // UPGRADE: Improved fallback logic for CommonJS files in worker threads
      const hasImportExportKeywords = content.includes('import') || content.includes('export');
      const hasCommonJSKeywords = content.includes('require') || content.includes('module.exports') || content.includes('exports.');
      const oxcFailedToFindDependencies = node.explicitImports.size === 0 && node.internalExports.size === 0;
      
      // Fallback to TS parser if:
      // 1. OXC failed completely, OR
      // 2. OXC found no dependencies but file has import/export keywords, OR
      // 3. OXC found no dependencies but file has CommonJS keywords
      if (!success || (oxcFailedToFindDependencies && (hasImportExportKeywords || hasCommonJSKeywords))) {
        try {
          // CRITICAL FIX: Scope reset for the TS parser in isolated thread context
          // Prevents incomplete scope chains from the previous file from leading to 'children of undefined'
          astAnalyzer.currentScope = { symbols: new Map(), parent: null, children: [] };
          astAnalyzer.scopeStack = [astAnalyzer.currentScope];
          astAnalyzer.scopeCounter = 0;
          
          await astAnalyzer.parseFile(filePath, content, node);
        } catch (tsError) {
          if (contextOptions.verbose) {
            console.error(`[Worker-Fallback-Error] TS parser failed at ${filePath}: ${tsError.message}`);
          }
          results.push(null);
          continue;
        }
      }

      // Safe serialization: Prevents crashes if internalExports or symbolSourceLocations are no longer Maps
      const serializedExports = node.internalExports instanceof Map 
        ? Object.fromEntries(node.internalExports) 
        : {};

      const serializedLocations = node.symbolSourceLocations instanceof Map
        ? Object.fromEntries(node.symbolSourceLocations)
        : {};

      // Serialize the node data for transfer back to main thread
      results.push({
        filePath: node.filePath,
        rawCode: node.rawCode, // UPGRADE: Pass raw code back to main thread for plugin analysis
        explicitImports: Array.from(node.explicitImports || []),
        dynamicImports: Array.from(node.dynamicImports || []),
        importedSymbols: Array.from(node.importedSymbols || []),
        rawStringReferences: Array.from(node.rawStringReferences || []),
        instantiatedIdentifiers: Array.from(node.instantiatedIdentifiers || []),
        propertyAccessChains: Array.from(node.propertyAccessChains || []),
        internalExports: serializedExports,
        securityThreats: node.securityThreats || [],
        localSuppressedRules: Array.from(node.localSuppressedRules || []),
        externalPackageUsage: Array.from(node.externalPackageUsage || []),
        symbolSourceLocations: serializedLocations,
        jsxComponents: Array.from(node.jsxComponents || []),
        jsxProps: Array.from(node.jsxProps || []),
        decorators: Array.from(node.decorators || []),
        isFrameworkContract: !!node.isFrameworkContract,
        isEntry: !!node.isEntry,
        isLibraryEntry: !!node.isLibraryEntry,
        isFrameworkComponent: !!node.isFrameworkComponent,
        calculatedDynamicImports: node.calculatedDynamicImports || [],
        globImports: node.globImports || []
      });
    } catch (err) {
      if (contextOptions.verbose) {
        console.error(`[Worker-Loop-Exception] Error in file ${filePath}: ${err.message}`);
      }
      results.push(null); // Skip module, keep thread alive
    }
  }

  parentPort.postMessage(results);
}

runTask().catch(err => {
  console.error(`[Worker Critical Fault] ${err.stack}`);
  process.exit(1);
});
