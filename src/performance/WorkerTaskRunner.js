import { parentPort, workerData } from 'worker_threads';
import { ASTAnalyzer } from '../ast/ASTAnalyzer.js';
import ts from 'typescript';
import fs from 'fs';

/**
 * Isolated Worker Thread Target Pipeline Task Loop Execution Instance
 */
async function processThreadChunks() {
  const { files, contextOptions } = workerData;
  const partialGraphPayloadResults = [];
  
  // Construct a lightweight standalone instance of our analyzer core inside the worker
  const standaloneAnalyzer = new ASTAnalyzer({ verbose: contextOptions.verbose });

  for (const file of files) {
    if (file.endsWith('package.json')) continue;

    try {
      const text = fs.readFileSync(file, 'utf8');
      
      // Build a minimal virtual reference mapping node to capture features
      const mockNode = {
        explicitImports: new Set(),
        dynamicImports: new Set(),
        importedSymbols: new Set(),
        rawStringReferences: new Set(),
        instantiatedIdentifiers: new Set(),
        propertyAccessChains: new Set(),
        internalExports: new Map(),
        securityThreats: []
      };

      const sourceFile = ts.createSourceFile(
        file,
        text,
        ts.ScriptTarget.Latest,
        true,
        standaloneAnalyzer.getScriptKind(file)
      );

      standaloneAnalyzer.extractTopLevelJSDocSuppreessions(sourceFile, mockNode);
      standaloneAnalyzer.walkNode(sourceFile, sourceFile, mockNode);

      partialGraphPayloadResults.push({
        filePath: file,
        explicitImports: Array.from(mockNode.explicitImports),
        dynamicImports: Array.from(mockNode.dynamicImports),
        importedSymbols: Array.from(mockNode.importedSymbols),
        rawStringReferences: Array.from(mockNode.rawStringReferences),
        instantiatedIdentifiers: Array.from(mockNode.instantiatedIdentifiers),
        propertyAccessChains: Array.from(mockNode.propertyAccessChains),
        internalExports: Object.fromEntries(mockNode.internalExports),
        securityThreats: mockNode.securityThreats,
        localSuppressedRules: Array.from(mockNode.localSuppressedRules)
      });
    } catch {
      // Ignore unparseable or locked syntax nodes in thread loops
    }
  }

  // Stream compiled metadata structures directly back to the primary supervisor pool thread channel
  parentPort.postMessage(partialGraphPayloadResults);
}

processThreadChunks();
