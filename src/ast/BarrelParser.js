import ts from 'typescript';
import fs from 'fs/promises';
import path from 'path';

/**
 * High-Density Barrel File Resolution Unwrapper
 * Flattens out complex multi-tier indirect export files ("Index of Doom").
 */
export class BarrelParser {
  constructor(context, resolver) {
    this.context = context;
    this.resolver = resolver;
    // Cache tracking matrices to eliminate recursive loops inside circular configurations
    this.processedBarrels = new Map();
  }

  /**
   * Evaluates if a target component operates primarily as a symbol redistribution barrel file.
   * @param {string} filePath - Absolute system file target pointer reference
   * @returns {Object|null} Map specification records tracking cross-exported identifiers
   */
  async parseBarrelSpecification(filePath) {
    if (this.processedBarrels.has(filePath)) {
      return this.processedBarrels.get(filePath);
    }

    try {
      const sourceText = await fs.readFile(filePath, 'utf8');
      const sourceFile = ts.createSourceFile(
        filePath,
        sourceText,
        ts.ScriptTarget.Latest,
        true
      );

      const manifest = {
        isBarrel: false,
        reExportedWildcards: new Set(), // export * from './module';
        reExportedNamedMappings: new Map(), // export { token } from './module';
        localExports: new Set()
      };

      this.analyzeExports(sourceFile, manifest);

      if (manifest.reExportedWildcards.size > 0 || manifest.reExportedNamedMappings.size > 0) {
        manifest.isBarrel = true;
      }

      this.processedBarrels.set(filePath, manifest);
      return manifest;
    } catch {
      return null;
    }
  }

  analyzeExports(node, manifest) {
    if (!node) return;

    switch (node.kind) {
      // Analyze global export declaration statement structures
      case ts.SyntaxKind.ExportDeclaration: {
        const specifier = node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier) 
          ? node.moduleSpecifier.text 
          : null;

        if (specifier) {
          if (!node.exportClause) {
            // Wildcard structural tracking pattern detected: export * from './module';
            manifest.reExportedWildcards.add(specifier);
          } else if (ts.isNamedExports(node.exportClause)) {
            // Named structural tracking pattern detected: export { symbol as key } from './module';
            node.exportClause.elements.forEach(element => {
              const originName = element.propertyName ? element.propertyName.text : element.name.text;
              const exposedName = element.name.text;
              manifest.reExportedNamedMappings.set(exposedName, {
                moduleSpecifier: specifier,
                localSymbolName: originName
              });
            });
          }
        }
        break;
      }
      
      // Secondary capture verification for locally bound structural variables
      case ts.SyntaxKind.FunctionDeclaration:
      case ts.SyntaxKind.ClassDeclaration:
      case ts.SyntaxKind.InterfaceDeclaration:
      case ts.SyntaxKind.TypeAliasDeclaration: {
        if (node.modifiers && node.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
          if (node.name && ts.isIdentifier(node.name)) {
            manifest.localExports.add(node.name.text);
          }
        }
        break;
      }
    }

    ts.forEachChild(node, child => this.analyzeExports(child, manifest));
  }

  /**
   * Resolves the true definition origin of an export, stripping away barrel file layer wrappers.
   * @param {string} barrelPath - Mapped structural index file context point
   * @param {string} symbolName - Mapped structural token identifier name
   * @param {Map} projectGraph - Global memory tracking references graph
   */
  async resolveSymbolOrigin(barrelPath, symbolName, projectGraph) {
    const manifest = await this.parseBarrelSpecification(barrelPath);
    if (!manifest || !manifest.isBarrel) {
      return { absolutePath: barrelPath, exportName: symbolName };
    }

    // Attempt alignment first against direct explicit named re-exports mappings
    if (manifest.reExportedNamedMappings.has(symbolName)) {
      const rule = manifest.reExportedNamedMappings.get(symbolName);
      const resolvedModule = this.resolver.resolveModulePath(barrelPath, rule.moduleSpecifier);
      return this.resolveSymbolOrigin(resolvedModule, rule.localSymbolName, projectGraph);
    }

    // Sweep across global star re-exports vectors
    for (const relativeModule of manifest.reExportedWildcards) {
      const resolvedModule = this.resolver.resolveModulePath(barrelPath, relativeModule);
      const subManifest = await this.parseBarrelSpecification(resolvedModule);
      
      // If target file records house the literal definition declaration boundary point directly, settle edge link
      if (projectGraph.has(resolvedModule)) {
        const node = projectGraph.get(resolvedModule);
        if (node.internalExports.has(symbolName) || (subManifest && subManifest.localExports.has(symbolName))) {
          return this.resolveSymbolOrigin(resolvedModule, symbolName, projectGraph);
        }
        
        // Dynamic recursive validation for barrel instances nested within barrel layers
        if (subManifest && subManifest.isBarrel) {
          const deepResolution = await this.resolveSymbolOrigin(resolvedModule, symbolName, projectGraph);
          if (deepResolution && deepResolution.absolutePath !== resolvedModule) {
            return deepResolution;
          }
        }
      }
    }

    return { absolutePath: barrelPath, exportName: symbolName };
  }
}
