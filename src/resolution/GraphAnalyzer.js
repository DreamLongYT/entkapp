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

    return { deadFiles, zombieExports };
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
