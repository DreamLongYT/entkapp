/**
 * ============================================================================
 * Circular Dependency Detector for pkg-scaffold v3.3.0
 * 
 * Copyright (C) 2026 DreamLongYT
 * Licensed under the Apache License, Version 2.0.
 * "The Original Code was made by DreamLongYT"
 * ============================================================================
 * Implements a high-performance Tarjan-based algorithm to
 * detect circular dependencies in the codebase graph.
 * Addresses Knip Issue #1734.
 */

export class CircularDetector {
  constructor(context) {
    this.context = context;
    this.cycles = [];
  }

  /**
   * Detects cycles in the provided dependency graph using Tarjan's SCC algorithm
   * @param {Map} graph - The codebase dependency graph
   * @returns {Array} List of detected cycles
   */
  detectCycles(graph, context = null) {
    if (context) this.context = context;
    this.cwd = context?.cwd || this.context?.cwd || process.cwd();
    this.cycles = [];
    let index = 0;
    const stack = [];
    const indices = new Map();
    const lowlink = new Map();
    const onStack = new Set();

    const strongconnect = (v) => {
      indices.set(v, index);
      lowlink.set(v, index);
      index++;
      stack.push(v);
      onStack.add(v);

      const node = graph.get(v);
      if (node && node.outgoingEdges) {
        for (const w of node.outgoingEdges) {
          if (!indices.has(w)) {
            strongconnect(w);
            lowlink.set(v, Math.min(lowlink.get(v), lowlink.get(w)));
          } else if (onStack.has(w)) {
            lowlink.set(v, Math.min(lowlink.get(v), indices.get(w)));
          }
        }
      }

      if (lowlink.get(v) === indices.get(v)) {
        const component = [];
        let w;
        do {
          w = stack.pop();
          onStack.delete(w);
          component.push(w);
        } while (w !== v);

        if (component.length > 1) {
          this.cycles.push(component.reverse());
        } else {
          // Check for self-loops
          const node = graph.get(v);
          if (node && node.outgoingEdges && node.outgoingEdges.has(v)) {
            this.cycles.push([v]);
          }
        }
      }
    };

    for (const v of graph.keys()) {
      if (!indices.has(v)) {
        strongconnect(v);
      }
    }

    return this.cycles;
  }

  /**
   * Formats cycles for reporting with file paths
   */
  formatCycles() {
    return this.cycles.map(cycle => {
      const paths = cycle.map(p => {
        // Extract relative path for readability
        let rel = p.replace(this.context.cwd, '').replace(/^\//, '');
        // Convert absolute Windows paths
        if (rel.includes(':\\')) {
          rel = rel.split(':\\')[1] || rel;
        }
        return rel;
      });
      if (cycle.length === 1) return `${paths[0]} -> (self-loop)`;
      return paths.join(' -> ') + ' -> ' + paths[0];
    });
  }

  /**
   * Gets detailed cycle information
   */
  getCycleDetails() {
    return this.cycles.map((cycle, idx) => ({
      cycleId: idx + 1,
      files: cycle.map(p => {
        let rel = p.replace(this.context.cwd, '').replace(/^\//, '');
        if (rel.includes(':\\')) {
          rel = rel.split(':\\')[1] || rel;
        }
        return rel;
      }),
      length: cycle.length,
      isSelfLoop: cycle.length === 1
    }));
  }
}

export default CircularDetector;
