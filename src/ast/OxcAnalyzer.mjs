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

  walkOxcAst(node, fileNode, content, pass) {
    if (!node) return;

    // Pass 1: Handle Imports and Exports
    if (pass === 1) {
      if (node.type === 'ImportDeclaration') {
        const specifier = node.source.value;
        fileNode.explicitImports.add(specifier);
      } else if (node.type === 'ExportNamedDeclaration') {
        if (node.source) {
          fileNode.explicitImports.add(node.source.value);
        }
        if (node.declaration) {
          this.extractExportFromDeclaration(node.declaration, fileNode);
        }
        if (node.specifiers) {
          node.specifiers.forEach(spec => {
            fileNode.internalExports.set(spec.exported.name || spec.exported.value, { type: 'export' });
          });
        }
      } else if (node.type === 'ExportDefaultDeclaration') {
        fileNode.internalExports.set('default', { type: 'default' });
      } else if (node.type === 'ExportAllDeclaration') {
        fileNode.explicitImports.add(node.source.value);
      }
    } 
    // Pass 2: Handle Identifiers and Calls
    else if (pass === 2) {
      if (node.type === 'IdentifierReference' || node.type === 'Identifier') {
        fileNode.instantiatedIdentifiers.add(node.name);
      } else if (node.type === 'CallExpression') {
        if (node.callee.type === 'Import') {
          const arg = node.arguments[0];
          if (arg && (arg.type === 'StringLiteral' || arg.type === 'Literal')) {
            fileNode.dynamicImports.add(arg.value);
          }
        } else if (node.callee.name === 'require') {
          const arg = node.arguments[0];
          if (arg && (arg.type === 'StringLiteral' || arg.type === 'Literal')) {
            fileNode.explicitImports.add(arg.value);
          }
        }
      }
    }

    // Recursive traversal
    for (const key in node) {
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(c => c && typeof c === 'object' && this.walkOxcAst(c, fileNode, content, pass));
      } else if (child && typeof child === 'object') {
        this.walkOxcAst(child, fileNode, content, pass);
      }
    }
  }

  extractExportFromDeclaration(decl, fileNode) {
    if (decl.type === 'VariableDeclaration') {
      decl.declarations.forEach(d => {
        if (d.id.type === 'Identifier') {
          fileNode.internalExports.set(d.id.name, { type: 'variable' });
        }
      });
    } else if (decl.id && decl.id.name) {
      fileNode.internalExports.set(decl.id.name, { type: decl.type.toLowerCase() });
    }
  }
}
