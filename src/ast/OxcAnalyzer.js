import path from 'path';

/**
 * Production-Grade Native Rust AST Parser Bridge (OXC)
 * Fixed for Windows environments to prevent path-based "Unexpected token" errors.
 */
export class OxcAnalyzer {
  constructor(context) {
    this.context = context;
    this.oxc = null;
    this.isAvailable = false;
  }

  async init() {
    if (this.context.usedExternalPackages) this.context.usedExternalPackages.add("oxc-parser");
    if (this.isAvailable) return true;
    try {
      const oxc = await import("oxc-parser");
      this.oxc = oxc;
      this.isAvailable = true;
      return true;
    } catch (e) {
      try {
        const { createRequire } = await import('module');
        const require = createRequire(import.meta.url);
        this.oxc = require("oxc-parser");
        this.isAvailable = true;
        return true;
      } catch (err) {
        this.isAvailable = false;
        return false;
      }
    }
  }

  /**
   * WINDOWS FIX: Robust path normalization for OXC.
   * Replaces backslashes with forward slashes to prevent escape sequence errors.
   */
  normalizePath(filePath) {
    if (!filePath) return filePath;
    let normalized = filePath.replace(/\\/g, '/');
    if (/^[a-z]:\//i.test(normalized)) {
      normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }
    return normalized.replace(/\/+/g, '/');
  }

  async parseFile(filePath, content, fileNode) {
    if (!this.isAvailable) {
      const initialized = await this.init();
      if (!initialized) return false;
    }

    try {
      const cleanContent = content.startsWith('\uFEFF') ? content.slice(1) : content;
      const normalizedPath = this.normalizePath(filePath);
      
      let result;
      try {
        result = this.oxc.parseSync(normalizedPath, cleanContent, {
          sourceType: "module",
          sourceFilename: normalizedPath,
          lang: "typescript"
        });
      } catch (e) {
        // Fallback with normalized path if the options object fails
        try {
          result = this.oxc.parseSync(normalizedPath, cleanContent);
        } catch (innerErr) {
          if (this.context.verbose) {
            console.error(`[OXC-ERROR] Native parse failed for: ${normalizedPath}`);
          }
          return false;
        }
      }

      let parsedResult;
      try {
        parsedResult = typeof result === 'string' ? JSON.parse(result) : JSON.parse(JSON.stringify(result));
      } catch (err) {
        if (result && typeof result === 'object') {
          parsedResult = result;
        } else {
          return false;
        }
      }

      let programRoot = null;
      if (parsedResult && typeof parsedResult === 'object') {
        if (parsedResult.program) programRoot = parsedResult.program;
        else if (parsedResult.ast) programRoot = parsedResult.ast;
        else if (parsedResult.type === 'Program' || parsedResult.body) programRoot = parsedResult;
      }

      // --- VALIDATION CHECK ---
      // If the file has content but OXC returns an empty body, it's a silent failure.
      if (cleanContent.trim().length > 0 && (!programRoot || !programRoot.body || programRoot.body.length === 0)) {
        if (this.context.verbose) {
          console.warn(`[OXC-WARNING] Silent failure detected for ${normalizedPath}. Body is empty despite content. Triggering Fallback...`);
        }
        return false; // This triggers the fallback to TypeScript in the engine
      }

      if (!programRoot || !programRoot.body) {
        return false;
      }

      fileNode.ast = programRoot; 
      fileNode.symbolTable = new Map(); 
      
      this.walkOxcAst(programRoot, fileNode, cleanContent, 1);
      this.walkOxcAst(programRoot, fileNode, cleanContent, 2);
      
      return true;
    } catch (e) {
      return false;
    }
  }

  // ... (walkOxcAst and other methods remain the same as in original)
  walkOxcAst(node, fileNode, content, pass) {
    if (!node) return;
    // (Implementation omitted for brevity, should be copied from original OxcAnalyzer.js)
  }
}
