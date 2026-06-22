import path from 'path';

/**
 * ============================================================================
 * Dead Code & Zombie Export Hunter v5.1.0
 * ============================================================================
 * Identifies unused files and exported symbols that are never imported.
 */
export class GraphAnalyzer {
  constructor(context) {
    this.context = context;
    this.cwd = context.cwd;
    // UPGRADE 5.4.3: Default Boundary Rules
    this.boundaryRules = context.config?.boundaries || [
      { from: 'packages/shared-*', to: 'apps/*', allow: false, message: 'Shared packages must not import from applications.' },
      { from: '*', to: '**/internal/**', allow: false, message: 'Private internal utilities must not be imported externally.' }
    ];
  }

  /**
   * UPGRADE 5.4.3: Boundary Enforcement
   * Checks if an import violates defined architectural boundaries.
   */
  checkBoundaries(fromPath, toPath) {
    const relFrom = path.relative(this.cwd, fromPath).replace(/\\/g, '/');
    const relTo = path.relative(this.cwd, toPath).replace(/\\/g, '/');

    for (const rule of this.boundaryRules) {
      const fromMatch = this._globMatch(relFrom, rule.from);
      const toMatch = this._globMatch(relTo, rule.to);

      if (fromMatch && toMatch && !rule.allow) {
        return { violated: true, message: rule.message };
      }
    }
    return { violated: false };
  }

  _globMatch(str, pattern) {
    if (pattern === '*') return true;
    const regex = new RegExp('^' + pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$');
    return regex.test(str);
  }

  /**
   * Performs a full reachability analysis from entry points.
   */
  async findDeadCode() {
    const graph = this.context.projectGraph;
    const reachable = new Set();
    const entries = [];

    // 1. Identify all confirmed entry points
    for (const [filePath, node] of graph.entries()) {
      if (node.isEntry) {
        entries.push(filePath);
        this._walk(filePath, reachable);
      }
    }

    const deadFiles = [];
    const zombieExports = [];

    // 2. Find unreachable files
    for (const filePath of graph.keys()) {
      if (!reachable.has(filePath)) {
        deadFiles.push(path.relative(this.cwd, filePath).replace(/\\/g, '/'));
      } else {
        // 3. Find Zombie Exports in reachable files
        const node = graph.get(filePath);
        if (node.isEntry) continue; // Skip entries as their exports are intended for external use

        for (const [symbol, meta] of node.internalExports.entries()) {
          if (symbol === 'default' || symbol === '*') continue;
          
          let isUsed = false;
          // Check if any other node imports this symbol
          for (const [otherPath, otherNode] of graph.entries()) {
            if (otherNode.importedSymbols && otherNode.importedSymbols.has(symbol)) {
              // This is a simplified check; in reality, we'd check if it's imported FROM this file
              isUsed = true;
              break;
            }
          }

          if (!isUsed) {
            zombieExports.push({
              file: path.relative(this.cwd, filePath).replace(/\\/g, '/'),
              symbol: symbol
            });
          }
        }
      }
    }

    const unusedImports = [];
    const boundaryViolations = [];

    for (const [filePath, node] of graph.entries()) {
      if (!reachable.has(filePath)) continue;

      // UPGRADE 5.4.3: Check boundaries for every import
      for (const impPath of node.explicitImports) {
        if (graph.has(impPath)) {
          const violation = this.checkBoundaries(filePath, impPath);
          if (violation.violated) {
            boundaryViolations.push({
              file: path.relative(this.cwd, filePath).replace(/\\/g, '/'),
              target: path.relative(this.cwd, impPath).replace(/\\/g, '/'),
              message: violation.message
            });
          }
        }
      }
      
      if (node.localImportBindings) {
        for (const [localName, meta] of node.localImportBindings.entries()) {
          // Check if this local binding is used anywhere in the file
          if (!node.instantiatedIdentifiers.has(localName)) {
            unusedImports.push({
              file: path.relative(this.cwd, filePath).replace(/\\/g, '/'),
              specifier: meta.specifier,
              symbol: meta.originalName === '*' ? 'Namespace' : meta.originalName
            });
          }
        }
      }
    }

    return { deadFiles, zombieExports, unusedImports, boundaryViolations };
  }

  _walk(filePath, reachable) {
    if (reachable.has(filePath)) return;
    reachable.add(filePath);

    const node = this.context.projectGraph.get(filePath);
    if (!node) return;

    for (const impPath of node.explicitImports) {
      this._walk(impPath, reachable);
    }
  }
}
